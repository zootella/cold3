
# Credential System

## Direction: unify credentials through one endpoint, one store, one envelope

The credential system flows through one endpoint (`/api/credential`), one store (`credentialStore`), and one pattern. `/api/otp` handles email/phone verification codes and will eventually migrate in too.

`Get.` returns a complete snapshot of every credential type in one response, `attachState` assembles that snapshot, and `apply()` in the store unpacks it into refs. Adding a new credential type means extending attachState and apply — not creating a new endpoint.

**Envelopes should unify too.** Right now OTP and TOTP each seal their own envelope into their own cookie. Rather than multiplying cookies, we should move toward a single `CredentialEnvelope` that can hold in-flight state for multiple credential operations simultaneously. One cookie, one envelope, multiple slots inside it for whatever's in progress.

**Reducing fetch calls is the goal.** A page load should be one GET to the credential endpoint. That one response tells credentialStore everything: which credentials exist, what their display values are, and whether any multi-step flows were interrupted. Components render from the store. When a user takes an action (enroll, remove, verify), that's one POST, and the response includes a fresh attachState snapshot so the store stays in sync. The number of fetch calls should be proportional to the number of user actions, not the number of credential types.

`/api/otp` will eventually become unnecessary as its functionality migrates into `/api/credential`.

## Current endpoint and store map

**`/api/credential` + `credentialStore`** — the main credential system. Handles Browser, Password, Name, TOTP, and Wallet. Every successful response includes `attachState` (full credential snapshot). Store exposes refs and methods for all credential types. Used by CredentialPanel and its sub-components (SetPasswordForm, TotpPanel, WalletPanel, etc).

Actions: `Get.`, `SignUpAndSignInTurnstile.`, `SignIn.`, `SignOut.`, `SetName.`, `RemoveName.`, `SetPassword.`, `RemovePassword.`, `CheckNameTurnstile.`, `GetPasswordCyclesTurnstile.`, `CloseAccount.`, `TotpEnroll1.`, `TotpEnroll2.`, `TotpRemove.`, `TotpValidate.`, `WalletProve1.`, `WalletProve2.`, `WalletRemove.`

**`/api/otp` + `pageStore.otps` + `useOtpCookie()`** — one-time passwords for email/phone verification. Envelope pattern: `FoundEnvelope.` lets the page recover active challenges from a cookie after refresh. Server opens the envelope and returns the non-secret display parts.

Actions: `SendTurnstile.`, `FoundEnvelope.`, `Enter.`

## Note: two cookies, future unification

Right now OTP and TOTP each have their own cookie and envelope: `temporary_envelope_otp` (sealed with action `'Otp.'`) and `temporary_envelope_totp` (sealed with action `'EnrollTotpEnvelope.'`). These exist independently because OTP and TOTP were built at different times. This works but doesn't scale — each new multi-step credential flow shouldn't bring its own cookie.

The future direction is a single `CredentialEnvelope` cookie that can hold in-flight state for multiple credential operations simultaneously — a TOTP enrollment and an OTP verification happening in the same session, stored in one envelope with slots for each. `Get.` already does this for TOTP; extending it to OTP means OTP's `FoundEnvelope.` action becomes unnecessary.

# Envelope and cookie analysis across credential types

## No envelope needed

These credential types are single-step operations with no provisional state.

**Browser** — server sets it on sign-in, done. Uses the httpOnly session cookie (`browserTag`), which is a separate system from enrollment envelopes.

**Name** — one call to set or remove. No multi-step flow.

**Password** — one call. Changing an existing password requires the current password in the same request, but that's validation, not a multi-step flow.

## Envelope needed, cookie-persisted

These are multi-step flows where the user might refresh the page mid-enrollment. The envelope is sealed by the server, stored in a client-readable cookie, and returned by the client on the next step.

**TOTP** — 2-step enrollment. `TotpEnroll1.` generates a secret and seals it in an envelope (action `'EnrollTotpEnvelope.'`). The client stores this in the `temporary_envelope_totp` cookie. `TotpEnroll2.` opens the envelope, validates the user's 6-digit code, and saves the secret. One enrollment per user at a time. Recovery: `Get.` checks for this cookie and reopens the enrollment UI if found.

**OTP** — 2-step challenge (send code, enter code). `SendTurnstile.` generates a code and seals it in an envelope (action `'Otp.'`). The client stores this in the `temporary_envelope_otp` cookie. `Enter.` opens the envelope and validates the user's guess. **Multiple simultaneous challenges** — the envelope holds an array of active challenges. A user signing up might authenticate both their email and phone number at the same time, producing two challenges in one envelope. Recovery: `FoundEnvelope.` opens the cookie and returns the non-secret display parts.

Both cookies use `cookieOptions.envelope`: `httpOnly: false` (page script must read for recovery), `sameSite: 'Strict'`, `maxAge: 20 minutes`, `secure` in production.

## Envelope needed, no cookie

These flows use envelopes for tamper-proof state, but the envelope travels a different way — not through a cookie.

**OAuth** — the envelope travels through the URL query parameter across the redirect to the OAuth provider and back. No cookie because the user leaves the site entirely. The envelope proves this browser initiated the request (anti-CSRF).

**Wallet** — the envelope stays in the request body. The signing happens in-page via a wallet popup (MetaMask, etc.), so there's no navigation away and no need for cookie persistence.

## Unification direction

The tension: TOTP has one slot per user, but OTP has an array of simultaneous challenges. A unified `CredentialEnvelope` cookie would need to hold both — a TOTP enrollment slot and an OTP challenges array — since a user signing up might be verifying their email (OTP) while also enrolling TOTP in the same session. OAuth and wallet don't need cookies at all, so they stay out of the unified cookie.

# Credential events and audit trail

## Current state: hide does the work, events are underused

`credential_table` has an `event` column defined as: 1 removed, 2 mentioned, 3 challenged, 4 validated. Most credential functions hardcode `event: 4`. Removal uses `queryHide` (sets the `hide` column), which makes rows invisible to `queryGet`. Wallet is the first type to use events 2 and 3 (WalletProve1 writes mentioned and challenged rows), but the rest of the system still only writes event 4.

The `hide` mechanism is convenient (level2 query helpers skip hidden rows by default) but destroys history. A user who enrolls TOTP, removes it, enrolls again — the first enrollment is gone. No record of credential lifecycle.

## Proposed direction: event rows replace hiding

Instead of hiding credential rows, write new rows with event numbers. A credential's lifecycle becomes a sequence of rows ordered by `row_tick`:

- Event 4 (validated): credential is active — the user has a password, a TOTP enrollment, a browser sign-in
- Event 1 (removed): credential is no longer active

No rows are hidden. The history accumulates. The current state is determined by looking at the most recent event for a given credential type.

## The watermark pattern

An event-1 row acts as a watermark — everything before it is dead, everything after it is alive.

**Browser** is the cleanest example. A user signs into 5 browsers (5 event-4 rows, each with a browserHash in k1). Then they sign out. Instead of hiding all 5 rows, write a single event-1 row of type Browser. Any browser sign-ins with an earlier tick than the most recent event-1 are dead. Any sign-ins after it are alive. One removal row wipes the slate without touching the original rows.

**TOTP** works naturally. Enroll: event-4 row with the secret in k1. Remove: event-1 row. The secret in the event-4 row ties the pair together — and TOTP secrets are globally unique. But even without linking, the watermark tells you the current state: most recent row for type Totp is event 4? Enrolled. Event 1? Not enrolled.

**Name** is the same shape. Set a name: event-4 row with f0/f1/f2. Remove it: event-1 row. Change it: event-4 row with the new name (the previous event-4 is now superseded by a later one). History shows every name a user has had.

**Password** — most recent row tells the current state. No natural identifier linking old and new hashes, but none needed. Whether to retain old hashes is a policy decision (detect password reuse vs don't store credentials longer than necessary), not a structural problem.

**OTP addresses** (email, phone) coming to credential_table will have natural identifiers in the f0/f1/f2 fields. Event 2 (mentioned) and 3 (challenged) start to earn their keep here — a user mentions an email, gets challenged with a code, validates it. The full sequence is recorded.

## Provisional state: database rows replace envelopes and cookies

Right now, multi-step enrollment flows (TOTP, OTP) persist provisional state in encrypted envelopes stored in client-side cookies. This works but requires careful code around replay attacks, cookie size limits, and recovery logic. If provisional state lives in credential_table instead, all the guarantees that envelopes provide through cryptography, the database provides by being the database — trusted, secret, no size limits.

**The trajectory is clean.** OTP started with `code_table` (a dedicated table for challenge state). We refactored to envelopes and cookies, eliminating code_table — going from two tables to one table plus a cookie. Moving provisional state into credential_table eliminates the cookie — going from one table plus a cookie to just one table. Each step is simpler.

**Refresh recovery becomes trivial.** Today the client carries the envelope in a cookie, and on page load sends it to the server for recovery. With database rows, the server already has the state — `Get.` queries for event-2/3 rows for this user and returns whatever's in progress. No cookie, no recovery logic, no `FoundEnvelope.` action.

**Multiple simultaneous OTP challenges stop being a cookie size problem.** Each challenge is its own event-3 row with its own address and code. A user verifying both email and phone at the same time: two rows, not one cookie straining against 4KiB.

**The extra write is real but cheap.** Envelopes are stateless on the server — no database write on step 1, just seal and hand back. Database rows mean a write on step 1. For TOTP that's one write. For OTP it's one write per challenge. These are single-row inserts into an indexed table, not expensive.

Events 2 (mentioned) and 3 (challenged) earn their keep here. A TOTP enrollment step 1 writes an event-3 row (challenged — the user has been given a secret to prove they can use). OTP send writes an event-3 row. Successful validation promotes to event 4.

## Browser binding: every provisional flow is single-browser

Every provisional flow must be started and completed at the same browserHash. Already true today with cookies; remains true with database rows. (OTP: "requested on laptop, reading email on phone" is an edge case — tying to one browser is simpler and more secure.)

Provisional rows store browserHash in k2. A TOTP event-3 row: k1=secret, k2=browserHash. An OTP event-3 row: k1=code, k2=browserHash, f0/f1/f2=address. On step 2, the server checks k2 matches.

## The userTag problem: early assignment for new users

TOTP is simple — a user adding TOTP is always already signed in with a userTag. But for signup flows (username+password, email, SMS), this is a brand new person at a browser. They have a browserHash (always), but no userTag. And credential_table requires a valid userTag on every row.

The solution: generate and assign a userTag immediately, at the very first moment there's anything about a person at a browser worth remembering. A userTag is just a random 21-character string — generating one commits to nothing. The moment someone starts any enrollment flow, mint a userTag, write a Browser event-4 row tying it to their browserHash, and provisional credential rows have somewhere to live.

This means a userTag no longer implies "this is a user" — it implies "this is an identity we're tracking." The distinction between a signup-in-progress and a full user lives in what credentials have reached event 4, not in whether a userTag exists. This is the right foundation anyway — the system needs to reason about what credentials a userTag has (creator vs fan vs staff), not just whether the tag exists.

Orphaned userTags (abandoned signups) are not a problem — event-3 rows expire naturally after 20 minutes.

## One query, application logic sifts

One query gets all rows for a user, ordered by tick (a few dozen rows at most). `attachState` already assembles the complete picture — it would change from four separate queries (browser, name, password, totp) each filtering by `event: 4` to one query, walking the rows and applying watermark logic per type. Event-2/3 provisionals come back in the same query — no extra round trip for recovery.

The event column stops being dead weight and becomes the actual mechanism. `queryHide` exits credential lifecycle (except perhaps `credentialCloseAccount` as a hard cutoff).

## Refactor assessment: replacing envelope cookies with event-3 rows

### What changes

Two cookies, two composable usages, two envelope seal/open pairs, and two recovery code paths all disappear. Each operation stays the same size but uses a database row instead of an envelope: `sealEnvelope(...)` becomes `credentialSet({event: 3, ...})`, `openEnvelope(...)` becomes a query for the event-3 row. `attachState`/`Get.` becomes one query that returns event-3 rows as in-progress enrollments alongside validated credentials.

### Wrinkles to figure out

**Expiration.** Envelopes have a 20-minute TTL baked in. Database rows don't expire — application logic needs to ignore event-3 rows older than 20 minutes (compare `row_tick` to now).

**Cancellation.** Currently `refCookie.value = null`. With rows: most recent event-3 wins, so a stale event-3 from a cancelled enrollment is harmless, but needs a clear rule.

**Early userTag for signup.** The biggest ripple. OTP is used during signup before a userTag exists. This requires minting a userTag before the first OTP send, which touches the signup flow architecture.

**OTP challenge identification.** Each challenge is its own row with its own `row_tag`, replacing the `tag` inside today's envelope array. Natural mapping.

**OTP code in plaintext.** Currently encrypted inside the envelope; in credential_table it's in k1 in plain text. The database is trusted and the code is short-lived 4-6 digits — acceptable.

**OAuth and wallet are unaffected.** They use envelopes for transport (URL redirects, request body), not cookies. This refactor only removes cookie-persisted envelopes.

# Credential integration status

## Fully integrated (credential_table + credentialStore + CredentialPanel)

**Browser** — sign-in sessions. k1=browserHash. Single-step, no envelope. `credentialBrowserGet/Set/Remove`.

**Name** — username with three forms. f0=normalized (route slug, unique), f1=formal (canonical), f2=display (user-chosen, also unique). Single-step. `credentialNameGet/Set/Remove/Check`.

**Password** — k1=hash, k2=cycles. Single-step, client hashes with pbkdf2 before sending. `credentialPasswordGet/Set/Remove`.

**TOTP** — k1=secret (base32). Two-step enrollment with envelope cookie. UI in TotpPanel with sub-components (TotpInput, TotpText1, TotpText2). Mobile detection via `browserIsBesideAppStore()`. `credentialTotpGet/Set/Remove`.

**Wallet/Ethereum** — f0=checksummed address. Two-step prove flow with envelope in request body (no cookie — signing happens in-page via wallet popup). UI in WalletPanel, wagmi lifecycle in wagmiStore (Pinia), wagmi/viem loaded on demand via `wevmDynamicImport()`. Two connectors: injected and WalletConnect. First credential type to write events 2/3 (mentioned/challenged in WalletProve1). `credentialWalletGet/Set/Remove`.

## Standalone, planned for integration

**Email/Phone (OTP)** — separate endpoint (`/api/otp`), separate store (`pageStore.otps`), separate components (`OtpRequestComponent`, `OtpEnterComponent`, `OtpEnterList`), separate cookie (`temporary_envelope_otp`). Currently uses `address_table`, which has a ttd note: "don't use, do this in credential_table instead." Multiple simultaneous challenges supported. This is the big one to bring in.

**OAuth** (Google, Twitter, Discord) — `/api/oauth`, `OauthDemo.vue`. Three actions: `OauthStatus.`, `OauthStart.`, `OauthDone.`. Envelope travels through URL query parameter across the redirect. Can prove a user controls an OAuth account, but doesn't save to credential_table yet.

# Integrating OTP, OAuth, and Wallet into credential_table

Before replacing envelope cookies with event-3 rows, the simpler prerequisite is getting OTP and OAuth into the unified credential system — the same way TOTP and Wallet were integrated. Actions in `/api/credential`, refs and methods in `credentialStore`, UI in `CredentialPanel`, rows in `credential_table`. The envelope/cookie mechanism stays the same for now; we're just consolidating where the logic lives.

## OTP (Email/Phone) — medium effort

The largest integration — OTP has the most moving parts.

**Server.** `/api/otp.js` logic moves into `/api/credential.js`. Actions: `OtpSendTurnstile.`, `OtpEnter.`. `FoundEnvelope.` merges into `Get.` (same pattern as TOTP recovery). `attachState` extends to return validated email/phone credentials (type `'Email.'`/`'Phone.'`, event 4). Rate limiting stays in trail_table.

**Database.** Validated addresses move from `address_table` into `credential_table` (f0=normalized, f1=formal, f2=display). `address_table` can be retired.

**Store.** `pageStore.otps` migrates into `credentialStore`. `useOtpCookie()` stays for now (cookie replacement is a separate later step).

**Components.** OTP components wire into `CredentialPanel`, calling `credentialStore` methods instead of `fetchWorker` directly.

**Wrinkle: the signup flow.** OTP is used both for credential management (signed-in user adds an email) and signup (new person proves address control). The credential endpoint requires a signed-in user for most actions. The signup path needs to work without one — either by making OTP actions available without a user (like `CheckNameTurnstile.` already is), or by creating a userTag early as discussed above.

## OAuth — small effort

The proof-of-concept already works end-to-end. The OAuth flow crosses three sites: Nuxt (cold3.cc), SvelteKit (oauth.cold3.cc), and the provider (google.com, etc.). The flow is:

1. **OauthDemo.vue** calls `OauthStart.` on Nuxt, gets a `OauthContinue.` envelope back.
2. Browser redirects to `oauth.cold3.cc/continue/{provider}?envelope=...`
3. **SvelteKit `+page.server.js`** opens the envelope to verify it's legit, renders the page.
4. **SvelteKit `+page.svelte`** auto-submits a form POST to Auth.js, which handles the provider dance (Google, Twitter, Discord).
5. **auth.js `signIn` callback** — after the provider dance succeeds, reads the browser's cookie to get `browserHash`, seals an `OauthDone.` envelope with the proven identity (`account`, `profile`, `user`, `browserHash`), and returns a redirect URL: `cold3.cc/oauth2?envelope=...`
6. **oauth2.vue** (Nuxt page) receives the envelope from the query string, posts it to `OauthDone.`.
7. **oauth.js `OauthDone.`** opens the envelope, verifies browserHash, has the proven identity. Currently just logs and returns a route.

Cancellation: if the user clicks Cancel at the provider, Auth.js redirects to SvelteKit's `/signin` page, which seals an `OauthDone.` envelope with `{error: errorCode}` instead of `{success: true}`, and redirects back to `oauth2.vue` the same way.

**The integration point is just step 7.** The SvelteKit side, the envelope flow, and the redirects all stay as-is. `OauthDone.` on success writes a credential_table row (type `'Google.'`/`'Twitter.'`/`'Discord.'`, event 4, k1=provider's user ID, f0=provider account name or email) and calls `attachState`. On cancellation: no row, just return a route. Store gains a ref for linked providers; OauthPanel.vue in CredentialPanel shows linked/unlinked providers. The envelope chain is inherent to the cross-origin flow and doesn't change.

## Sequencing

Wallet done (see wallet.md for dev panel, test scenarios, and SIWE migration plan). OAuth next — small, the integration point is narrow (just `OauthDone.`), but the full flow spans three sites. OTP last — most impactful but has the most architectural questions (signup flow, address_table retirement, multiple simultaneous challenges, early userTag assignment).
