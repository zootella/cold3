
# Credential System

## Direction: unify credentials through one endpoint, one store, one envelope

The credential system flows through one endpoint (`/api/credential`), one store (`credentialStore`), and one pattern. `/api/otp` handles email/phone verification codes and will eventually migrate in too.

`Get.` returns a complete snapshot of every credential type in one response, `attachState` assembles that snapshot, and `apply()` in the store unpacks it into refs. Adding a new credential type means extending attachState and apply — not creating a new endpoint.

**Envelopes should unify too.** Right now OTP and TOTP each seal their own envelope into their own cookie. Rather than multiplying cookies, we should move toward a single `CredentialEnvelope` that can hold in-flight state for multiple credential operations simultaneously. One cookie, one envelope, multiple slots inside it for whatever's in progress.

**Reducing fetch calls is the goal.** A page load should be one GET to the credential endpoint. That one response tells credentialStore everything: which credentials exist, what their display values are, and whether any multi-step flows were interrupted. Components render from the store. When a user takes an action (enroll, remove, verify), that's one POST, and the response includes a fresh attachState snapshot so the store stays in sync. The number of fetch calls should be proportional to the number of user actions, not the number of credential types.

`/api/otp` will eventually become unnecessary as its functionality migrates into `/api/credential`.

## TOTP integration (done)

TOTP is now a first-class credential in `/api/credential` and `credentialStore`, alongside Browser, Password, and Name. Actions: `TotpEnroll1.`, `TotpEnroll2.`, `TotpRemove.`. UI lives in `TotpPanel.vue`, wired into `CredentialPanel.vue`.

`Get.` already absorbs the FoundEnvelope pattern for TOTP: if the client includes an enrollment envelope cookie in the Get body, the server opens it and returns the enrollment data (URI, identifier) alongside the regular credential snapshot. One fetch on page load recovers an in-progress enrollment — no separate round-trip. This is the model for how OTP's `FoundEnvelope.` should eventually work too.

## TOTP mobile enrollment flow (done)

The enrollment UI needs to handle two contexts: desktop (user scans a QR code with their phone) and mobile (the user's phone IS the device — they can't scan their own screen).

`browserIsBesideAppStore()` from icarus wraps the `is-mobile` npm package to detect phones and tablets. The original TotpDemo code used this to automatically redirect via `window.location.href = otpauth://...`, which opens the authenticator app directly. But this has a problem: when the user swipes back to the browser after adding the code in their authenticator, the page is in a broken state. The redirect happened after `emit('edit')` expanded the panel, but the enrollment UI state (refUri, refStep) was never set up because the mobile path skipped that. So the user returns to an expanded but empty section with no code input visible.

The fix: use `browserIsBesideAppStore()` to choose which control to show, but don't auto-redirect. On desktop, show the QR code. On mobile, show a "Load in Authenticator App" button the user taps voluntarily. Both paths land in the same enrollment UI state — step 2 with the code input visible and ready. When a mobile user taps the button and then swipes back from their authenticator, the page is still showing the code input waiting for their 6-digit code.

The enrollment flow becomes the same on both platforms: Add → enrollment UI appears (QR on desktop, button on mobile) with code input → user gets the code into their authenticator one way or the other → enters 6-digit code → done.

### Implementation notes (pick up here)

**The bug.** `onEnroll()` lines 72-74 in TotpPanel.vue have a mobile branch that does `emit('edit')` then `window.location.href = uri` without ever setting `refUri` or `refStep = 2`. When the user swipes back from the authenticator, the panel is expanded but the step-2 template guard (`v-else-if="refStep === 2 && refUri"`) doesn't match. Empty card. Mobile browsers often restore from bfcache rather than reloading, so the broken Vue state persists as-is.

**The fix, in four parts.**

**(1) Add a const and a function.** After `const refCookie = useTotpCookie()`, add `const refMobile = browserIsBesideAppStore()`. Add a function `onOpenAuthenticator()` that does `window.location.href = refUri.value`.

**(2) Unify `onEnroll()`.** Remove the `if (browserIsBesideAppStore())` branch entirely. The function should always do: set `refUri.value`, set `refStep.value = 2`, then `emit('edit')`. Same path on both platforms. The mobile-specific behavior moves to the template.

**(3) Template: QR on desktop, button on mobile.** Inside the step-2 template block (`v-else-if="refStep === 2 && refUri"`), use `refMobile` to switch what shows. Desktop: the existing QR + side-by-side layout with instruction text "Scan the QR, then enter the 6 digits you get below." Mobile: a "Load in Authenticator App" button (calls `onOpenAuthenticator`) with instruction text adjusted for tapping instead of scanning. Both show the code input and Enter/Cancel buttons. The `flex gap-4` layout with `shrink-0` QR div is desktop-only; mobile gets a simpler vertical layout.

**(4) bfcache recovery — not needed.** When the user taps the button and swipes back from the authenticator, there are three possibilities: (a) page still warm, (b) bfcache thaw, (c) full reload. Cases (a) and (b) both preserve Vue state — `refStep` is 2, `refUri` is set, the code input is waiting — so there's nothing to recover. Case (c) is already handled by `onMounted`'s cookie recovery via `credentialStore.enrollment` from `Get.`'s envelope pattern. OauthDemo.vue uses a `pageshow` listener for the opposite reason — OAuth needs to *reset* state when the user comes back (they abandoned the flow), whereas TOTP coming back means the flow is *continuing* into already-correct state.

**Smoke test.** Desktop: happy and sad paths still work (nothing changes for desktop flow). Mobile (iPhone Chrome, Galaxy Fold Chrome): tap Add, see the "Load in Authenticator App" button appear (no QR), tap the button, authenticator opens with the code, swipe back, code input still there, enter 6 digits, enrolled.

## Current endpoint and store map

**`/api/credential` + `credentialStore`** — the main credential system. Handles Browser, Password, Name, and TOTP. Every successful response includes `attachState` (full credential snapshot). Store exposes refs and methods for all credential types. Used by CredentialPanel and its sub-components (SetPasswordForm, TotpPanel, etc).

Actions: `Get.`, `SignUpAndSignInTurnstile.`, `SignIn.`, `SignOut.`, `SetName.`, `RemoveName.`, `SetPassword.`, `RemovePassword.`, `CheckNameTurnstile.`, `GetPasswordCyclesTurnstile.`, `CloseAccount.`, `TotpEnroll1.`, `TotpEnroll2.`, `TotpRemove.`, `TotpValidate.`

**`/api/otp` + `pageStore.otps` + `useOtpCookie()`** — one-time passwords for email/phone verification. Envelope pattern: `FoundEnvelope.` lets the page recover active challenges from a cookie after refresh. Server opens the envelope and returns the non-secret display parts.

Actions: `SendTurnstile.`, `FoundEnvelope.`, `Enter.`

## Note: two cookies, future unification

Right now OTP and TOTP each have their own cookie and envelope: `temporary_envelope_otp` (sealed with action `'Otp.'`) and `temporary_envelope_totp` (sealed with action `'EnrollTotpEnvelope.'`). These exist independently because OTP and TOTP were built at different times. This works but doesn't scale — each new multi-step credential flow shouldn't bring its own cookie.

The future direction is a single `CredentialEnvelope` cookie that can hold in-flight state for multiple credential operations simultaneously — a TOTP enrollment and an OTP verification happening in the same session, stored in one envelope with slots for each. `Get.` already does this for TOTP; extending it to OTP means OTP's `FoundEnvelope.` action becomes unnecessary.

## TOTP mobile: split enrollment into two visual stages (done)

On mobile, showing the "Load in Authenticator App" button and the code input + Enter/Cancel all at once is a lot for a small screen. Split the mobile flow into two visual stages: first the button, then (after tapping it) the code input. Desktop is unchanged.

Initially implemented with `refStep` (integer 1/2/3), then refactored to declarative booleans. `refUri` (truthy = enrollment active) and `refOpened` (boolean = mobile user has tapped Load) replaced the integer state machine. Each template element knows when to appear: QR shows when `refUri && !refMobile`, Load button shows when `refUri && refMobile`, code input shows when `refUri && (!refMobile || refOpened)`. No step numbers to mentally map.

Sub-components extracted to `components/totp/`: `TotpText1.vue` (shared instruction text, slot for mid-sentence injection), `TotpText2.vue` (identifier tip, prop-driven with self-guarding v-if), `TotpInput.vue` (numeric code input, defineModel for v-model).

## Unify TOTP endpoint into credential endpoint (done)

`/api/credential.js` now has all TOTP logic: `TotpEnroll1.`, `TotpEnroll2.`, `TotpRemove.`, `TotpValidate.`. The standalone `/api/totp.js` endpoint and its demo components (`TotpDemo.vue`, `TotpDemo1.vue`) have been deleted. The credential endpoint is the single home for TOTP, with full comments, rate limiting, and trail logging. A latent bug in the old totp.js (`totpValidate` called without `Data({base32:})` wrapping) was fixed in the process.

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

## Current state: hide does the work, event is dead weight

`credential_table` has an `event` column defined as: 1 removed, 2 mentioned, 3 challenged, 4 validated. But every credential function hardcodes `event: 4`. Removal uses `queryHide` (sets the `hide` column), which makes rows invisible to `queryGet`. Events 1, 2, and 3 are never written. The event column exists but earns nothing.

The `hide` mechanism exists so that the general-purpose query helpers in level2 don't have to search around removed rows — by default they only see rows where `hide` is 0. This is convenient but it destroys history. A user who enrolls TOTP, removes it, enrolls again — the first enrollment is hidden, gone from queries. There's no record of when credentials were added or removed, how many times a user churned through enrollments, or what the previous state was.

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

**Password** doesn't have a natural identifier — you can't look at two hashes and know they're related. But it doesn't need one. The most recent row for type Password tells you the current state. Event 4: they have a password, and that row has the hash and cycles. Event 1: they don't. Earlier event-4 rows are previous passwords, ordered by tick. No linking needed — password is actually simpler than TOTP in this model. (Whether to retain old password hashes is a policy decision — "detect password reuse" vs "don't store credentials longer than necessary" — not a structural problem.)

**OTP addresses** (email, phone) coming to credential_table will have natural identifiers in the f0/f1/f2 fields. Event 2 (mentioned) and 3 (challenged) start to earn their keep here — a user mentions an email, gets challenged with a code, validates it. The full sequence is recorded.

## Provisional state: database rows replace envelopes and cookies

Right now, multi-step enrollment flows (TOTP, OTP) persist provisional state in encrypted envelopes stored in client-side cookies. The envelope pattern exists because we hand state to the untrusted client and need guarantees: the server created it, nobody tampered with it, it hasn't expired, it came from the same browser. Symmetric encryption provides all of this, but at the cost of complexity — lots of careful code and comments about replay attacks, cookie size limits for multiple OTP challenges, recovery logic on page refresh.

If provisional state lives in credential_table instead, everything is already trusted and secret. The server wrote the row, nobody outside can see or modify it, and the server reads it back directly. No encryption, no tamper detection, no cookie size limits. The guarantees that envelopes provide through cryptography, the database provides by being the database.

**The trajectory is clean.** OTP started with `code_table` (a dedicated table for challenge state). We refactored to envelopes and cookies, eliminating code_table — going from two tables to one table plus a cookie. Moving provisional state into credential_table eliminates the cookie — going from one table plus a cookie to just one table. Each step is simpler.

**Refresh recovery becomes trivial.** Today the client carries the envelope in a cookie, and on page load sends it to the server for recovery. With database rows, the server already has the state — `Get.` queries for event-2/3 rows for this user and returns whatever's in progress. No cookie, no recovery logic, no `FoundEnvelope.` action.

**Multiple simultaneous OTP challenges stop being a cookie size problem.** Each challenge is its own event-3 row with its own address and code. A user verifying both email and phone at the same time: two rows, not one cookie straining against 4KiB.

**The extra write is real but cheap.** Envelopes are stateless on the server — no database write on step 1, just seal and hand back. Database rows mean a write on step 1. For TOTP that's one write. For OTP it's one write per challenge. These are single-row inserts into an indexed table, not expensive.

Events 2 (mentioned) and 3 (challenged) earn their keep here. A TOTP enrollment step 1 writes an event-3 row (challenged — the user has been given a secret to prove they can use). OTP send writes an event-3 row. Successful validation promotes to event 4.

## Browser binding: every provisional flow is single-browser

Every credential's provisional flow must be started and completed at the same browserHash. This is already true today with cookies (another device won't have the cookie), and remains true with database rows.

- **TOTP**: Must be same browser. No legitimate reason to split enrollment across browsers.
- **OTP**: Could imagine "requested code on laptop, reading email on phone" — but this is an edge case, and tying to one browser is simpler and more secure. The code alone is not sufficient; you must also be the browser that requested it.
- **Wallet**: Inherently browser-bound — the wallet extension lives in the browser.
- **OAuth**: Inherently browser-bound — the redirect returns to the same browser.
- **Password**: Single-step, not relevant.

This means provisional rows (event 2/3) need to record which browser initiated the flow. Rather than adding a `browser_hash` column to credential_table, use one of the k-fields. A TOTP event-3 row: k1=secret, k2=browserHash. An OTP event-3 row: k1=code, k2=browserHash, with the address in f0/f1/f2. The k-fields are already there for "whatever this credential type needs." On step 2, the server checks that the completing browser matches k2.

## The userTag problem: early assignment for new users

TOTP is simple — a user adding TOTP is always already signed in with a userTag. But for signup flows (username+password, email, SMS), this is a brand new person at a browser. They have a browserHash (always), but no userTag. And credential_table requires a valid userTag on every row.

The solution: generate and assign a userTag immediately, at the very first moment there's anything about a person at a browser worth remembering. A userTag is just a random 21-character string — generating one commits to nothing. The moment someone starts any enrollment flow, mint a userTag, write a Browser event-4 row tying it to their browserHash, and provisional credential rows have somewhere to live.

This means a userTag no longer implies "this is a user." It implies "this is an identity we're tracking." A fresh userTag with only a Browser row and some event-3 provisionals is someone in the middle of signup. A userTag with validated Name, Password, and Browser rows is a full user. The distinction lives in what credentials have reached event 4, not in whether a userTag exists.

This is the right foundation anyway. Even with established users, different credential combinations will mean different things — a creator who can post vs a fan who can only favorite vs a staff member with admin access. The system needs to reason about what credentials a userTag has, not just whether the tag exists. Early assignment forces that discipline from the start.

Orphaned userTags (someone starts signup, abandons it) are not a problem. The provisional event-3 rows expire naturally — the server can ignore or clean up provisionals older than 20 minutes. The Browser event-4 row is no different from what already happens today when `credentialBrowserSet` runs on signup.

## One query, application logic sifts

The database query becomes simple: get all rows for this user, ordered by tick. Even a complex user with multiple credential types, enrollments, and removals won't have more than a few dozen rows. One query brings them all back.

The interpretation lives in server-side application logic, not in query filters. This maps naturally to `attachState` in credential.js — it already assembles the complete picture of a user's credentials. Right now it makes four separate queries (browser, name, password, totp), each filtering by `event: 4`. With the all-rows approach, it would be one query, then walk the rows applying the watermark logic per credential type. Provisional event-2/3 rows come back in the same query — no additional round trip to recover in-progress enrollments.

The event column stops being dead weight and becomes the actual mechanism. `queryHide` is no longer involved in credential lifecycle. The `hide` column still exists on the table (it's part of every table's schema), but credential operations don't use it — except perhaps `credentialCloseAccount`, which might still hide everything as a hard cutoff.

## Refactor assessment: replacing envelope cookies with event-3 rows

### What gets deleted

Two cookies, two composable usages, two envelope seal/open pairs, and two recovery code paths all disappear:

- `sealEnvelope`/`openEnvelope` calls in TOTP enrollment (credential.js) and OTP (otp.js)
- `useTotpCookie()` in TotpPanel.vue and `useOtpCookie()` in OTP components
- The `FoundEnvelope.` action in otp.js — gone entirely
- The envelope recovery block in `Get.` (the `hasText(body.envelope)` branch) — gone entirely
- Cookie-sending logic in credentialStore's `load()` — the server already has the state
- TotpPanel's `onMounted` cookie recovery — replaced by store data that `Get.` returns from event-3 rows

### What changes shape

The operations stay the same size, they just use database rows instead of envelopes:

- TotpEnroll1: `sealEnvelope(...)` → `credentialSet({event: 3, type: 'Totp.', k1: secret, k2: browserHash})`
- TotpEnroll2: `openEnvelope(...)` → query for event-3 Totp row, check k2 matches browserHash, validate code, write event-4 row
- OTP Send: `sealEnvelope(...)` → `credentialSet({event: 3, type: 'Otp.', k1: code, k2: browserHash, f0/f1/f2: address})`
- OTP Enter: `openEnvelope(...)` → query for event-3 Otp row by row_tag, check k2 matches browserHash, validate code
- `attachState` / `Get.`: one query instead of four, returns any event-3 rows as in-progress enrollments alongside validated credentials

### Wrinkles to figure out

**Expiration.** Envelopes have a 20-minute TTL baked in — `openEnvelope` checks it for you. Database rows don't expire. Application logic needs to ignore event-3 rows older than 20 minutes (compare `row_tick` to now). This is straightforward but it's a new responsibility: every place that reads event-3 rows needs to check staleness.

**Cancellation semantics.** Cancelling TOTP enrollment currently means `refCookie.value = null`. With database rows: write an event-1? Ignore the stale event-3 and let it expire? If the user cancels and re-enrolls immediately, there's a stale event-3 with the old secret alongside the new event-3. Probably fine — most recent event-3 wins — but needs a clear rule.

**Early userTag for signup.** The biggest ripple. OTP is used during signup before a userTag exists. This refactor requires minting a userTag and writing a Browser row before the first OTP send. The signup flow currently creates the userTag at the moment of `SignUpAndSignInTurnstile.`, not before. The OTP endpoint would need to either receive a userTag or create one. This touches the signup flow architecture.

**OTP challenge identification.** Each OTP challenge currently has a `tag` inside the envelope array. With rows, each challenge is its own row with its own `row_tag`. The client needs to know which row_tag to reference when entering a code — the server returns the row_tag as the challenge identifier, the client sends it back on Enter. Different identifier than today's challenge tag, but a natural mapping.

**OTP code in plaintext.** The code is currently encrypted inside the envelope. In credential_table it would be in k1 in plain text. The database is trusted, and the code is short-lived and low-entropy (4-6 digits). If someone has database access they have much bigger problems. Probably fine, but worth noting the change.

**OAuth and wallet are unaffected.** They use envelopes for fundamentally different reasons — URL transport across redirects (OAuth), request body for in-page wallet signing. Neither uses cookies. Envelope infrastructure stays for those. This refactor only removes cookie-persisted envelopes.

### Sequencing

TOTP is the smaller, cleaner first step. The user always has a userTag, there's one enrollment at a time, and the flow is self-contained in credential.js and TotpPanel.vue. It could be done in a focused session as a proof of concept.

OTP is the larger second effort. The early-userTag question, multiple simultaneous challenges, and the fact that OTP touches the signup flow all add scope. But TOTP going first proves the pattern and makes OTP's path clearer.

# Credential integration status

## Fully integrated (credential_table + credentialStore + CredentialPanel)

**Browser** — sign-in sessions. k1=browserHash. Single-step, no envelope. `credentialBrowserGet/Set/Remove`.

**Name** — username with three forms. f0=normalized (route slug, unique), f1=formal (canonical), f2=display (user-chosen, also unique). Single-step. `credentialNameGet/Set/Remove/Check`.

**Password** — k1=hash, k2=cycles. Single-step, client hashes with pbkdf2 before sending. `credentialPasswordGet/Set/Remove`.

**TOTP** — k1=secret (base32). Two-step enrollment with envelope cookie. UI in TotpPanel with sub-components (TotpInput, TotpText1, TotpText2). Mobile detection via `browserIsBesideAppStore()`. `credentialTotpGet/Set/Remove`.

## Standalone, planned for integration

**Email/Phone (OTP)** — separate endpoint (`/api/otp`), separate store (`pageStore.otps`), separate components (`OtpRequestComponent`, `OtpEnterComponent`, `OtpEnterList`), separate cookie (`temporary_envelope_otp`). Currently uses `address_table`, which has a ttd note: "don't use, do this in credential_table instead." Multiple simultaneous challenges supported. This is the big one to bring in.

## Proof-of-concept stubs, not integrated

**OAuth** (Google, Twitter, Discord) — `/api/oauth`, `OauthDemo.vue`. Three actions: `OauthStatus.`, `OauthStart.`, `OauthDone.`. Envelope travels through URL query parameter across the redirect. Can prove a user controls an OAuth account, but doesn't save to credential_table yet.

**Wallet/Ethereum** — `/api/wallet`, `WalletDemo.vue`. Two actions: `Prove1.`, `Prove2.`. Envelope in request body. Verifies wallet signature with viem. Can prove a user controls an Ethereum address, but doesn't save to credential_table yet.

# Integrating OTP, OAuth, and Wallet into credential_table

Before replacing envelope cookies with event-3 rows (the refactor described above), the simpler prerequisite is getting OTP, OAuth, and Wallet into the unified credential system — the same way TOTP was integrated. This means: actions in `/api/credential`, refs and methods in `credentialStore`, UI in `CredentialPanel`, rows in `credential_table`. The envelope/cookie mechanism stays the same for now; we're just consolidating where the logic lives.

## OTP (Email/Phone) — medium effort

This is the largest integration because OTP has the most moving parts.

**Server side.** Move the logic from `/api/otp.js` into `/api/credential.js`. Actions become `OtpSendTurnstile.`, `OtpEnter.`. The `FoundEnvelope.` action merges into `Get.` — same pattern as TOTP enrollment recovery. `attachState` extends to query for validated email/phone credentials (type `'Email.'` or `'Phone.'`, event 4) and return them alongside the other credential types. Rate limiting stays in trail_table as-is.

**Database.** OTP validated addresses move from `address_table` into `credential_table`. The f-fields are a natural fit: f0=normalized address, f1=formal address, f2=display address. type_text is `'Email.'` or `'Phone.'`. `address_table` can be retired.

**Store.** `credentialStore` gains refs for validated addresses (array of emails, array of phones) and methods for send/enter. `pageStore.otps` migrates into `credentialStore` — in-progress challenges become part of the credential store's state. `useOtpCookie()` stays for now (cookie replacement is a separate later step).

**Components.** `OtpRequestComponent` and `OtpEnterComponent` wire into `CredentialPanel` alongside the existing sub-panels. They call `credentialStore` methods instead of `fetchWorker` directly.

**Wrinkle: the signup flow.** OTP is used both for managing credentials (signed-in user adds an email) and for signup (brand-new person proves they control an address). The credential endpoint currently requires a signed-in user for most actions. The signup path needs to work without one — either by making OTP send/enter available without a user (like `CheckNameTurnstile.` and `GetPasswordCyclesTurnstile.` already are), or by creating a userTag early as discussed above.

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

**The integration point is just step 7.** The SvelteKit side, the envelope flow, and the redirects all stay exactly as they are. The only new code is in `OauthDone.`:

- On success: write a credential_table row (type `'Google.'`/`'Twitter.'`/`'Discord.'`, event 4, k1=provider's user ID, f0=provider account name or email). Call `attachState` so the response includes the full credential snapshot.
- `attachState` extends to query for OAuth credential types and return linked providers.
- On cancellation: no row, just return a route.

**Store.** `credentialStore` gains a ref for linked OAuth providers and methods for start/remove.

**Components.** An `OauthPanel.vue` in CredentialPanel, similar to TotpPanel. Shows linked providers with Remove buttons, and Add buttons for unlinked ones.

**Envelope stays as-is.** The three-envelope chain (OauthContinue sealed by Nuxt, opened by SvelteKit; OauthDone sealed by SvelteKit, opened by Nuxt) is inherent to the cross-origin redirect flow and doesn't change. No cookies involved.

## Wallet — small effort, doing first (next)

Working proof-of-concept in `/api/wallet.js` and `WalletDemo.vue`. Same two-step playbook as TOTP integration: build alongside, smoke test, then delete the standalone version.

### What exists now

**Server (`wallet.js`)** — two actions:
- `Prove1.` — validates address with `checkWallet`, generates nonce (`Tag()`), composes human-readable message, seals `ProveWallet.` envelope containing `browserHash + address + nonce + message`. Returns message, nonce, envelope to client.
- `Prove2.` — receives address, nonce, message, signature, and envelope back. Opens envelope, checks expiration, verifies message matches (anti-tamper with safefill), confirms nonce is in message, calls viem's `verifyMessage` to cryptographically confirm the signature. Currently logs success but doesn't save to database.

**Client (`WalletDemo.vue`)** — much larger, handles:
- Dynamic import of wagmi/viem via `wevmDynamicImport()` (heavy libraries, loaded on demand)
- wagmi config with two connectors: injected (MetaMask) and WalletConnect (QR code + relay)
- Connection state, QR code display, reconnection on mount
- ETH price and block number quotes from Alchemy (demo decoration, not credential-related)
- The prove flow: `Prove1.` → wagmi `signMessage` → `Prove2.`
- Error handling for wallet-specific edge cases (provider not found, user rejected, timeout, network errors)

**Envelope stays in request body.** The signing happens in-page via wallet popup, no navigation away. No cookie needed.

### Step 1: build wallet into credential system alongside existing demo

Same approach as TOTP — copy, don't move. WalletDemo.vue and wallet.js stay untouched.

**Server side.** Add `WalletProve1.` and `WalletProve2.` actions to `/api/credential.js`. Copy the logic from wallet.js with all comments, notes, and concerns intact. On `WalletProve2.` success, additionally write a credential_table row: type `'Ethereum.'`, event 4, f0=checksummed address. Add `WalletRemove.` action. Extend `attachState` to return the user's wallet address (0 or 1 per user). Import `checkWallet` from icarus and `verifyMessage` from viem.

**Store.** Add to `credentialStore`: `wallet` ref (string, checksummed address or empty), `apply()` unpacks `task.wallet`. Methods: `walletProve1({address})`, `walletProve2({address, nonce, message, signature, envelope})`, `walletRemove()`.

**Components.** Create `WalletPanel.vue` in `components/wallet/`. Wire into `CredentialPanel.vue` alongside TotpPanel. Needs wagmi plumbing — the connection and signing logic from WalletDemo. The ETH quotes are demo decoration and don't come along.

**Wagmi state question.** WalletDemo.vue manages wagmi config and watchers locally in the component. The ttd notes discuss moving this to a Pinia store so wagmi loads once and persists across navigation. For now, keep wagmi state in WalletPanel the same way WalletDemo does it — component-local. The store refactor is a separate concern and can happen later without touching credential_table integration.

**Smoke test.** Connect with MetaMask (injected), prove ownership, verify credential_table row appears and CredentialPanel shows the wallet. Same with WalletConnect (QR code on desktop, deep link on mobile). Remove wallet, verify row is gone from attachState. WalletDemo.vue still works independently on its demo page.

### Step 2: delete standalone wallet demo

After smoke test passes, identify and delete everything standalone:
- `site/server/api/wallet.js`
- `site/app/components/snippet1/WalletDemo.vue`
- Remove `<WalletDemo />` from whatever page hosts it
- Confirm nothing in wallet.js has insights that credential.js lacks
- Update credential.md

## Sequencing

Wallet first — it's the smallest integration and the prove flow is self-contained (no redirects, no cookies, no cross-origin). Good proof that the pattern works for non-TOTP credential types.

OAuth second — also small, but the cross-origin SvelteKit flow adds complexity to understand. The integration point is narrow (just `OauthDone.`), but the full flow spans three sites.

OTP last — most impactful (email/phone are core identity credentials) but has the most architectural questions to resolve (signup flow, address_table retirement, multiple simultaneous challenges, early userTag assignment). Getting Wallet and OAuth integrated first means credential_table has more types flowing through it, and the pattern is well-exercised before tackling the hard one.
