
# Credential System

## Direction: unify credentials through one endpoint, one store, one envelope

The credential system flows through one endpoint (`/api/credential`), one store (`credentialStore`), and one pattern. Email/phone verification codes migrated in from the old `/api/otp`, which is deleted.

`Get.` returns a complete snapshot of every credential type in one response, `attachState` assembles that snapshot, and `apply()` in the store unpacks it into refs. Adding a new credential type means extending attachState and apply — not creating a new endpoint.

**Envelopes should unify too.** Right now OTP and TOTP each seal their own envelope into their own cookie. Rather than multiplying cookies, we should move toward a single `CredentialEnvelope` that can hold in-flight state for multiple credential operations simultaneously. One cookie, one envelope, multiple slots inside it for whatever's in progress.

**Reducing fetch calls is the goal.** A page load should be one GET to the credential endpoint. That one response tells credentialStore everything: which credentials exist, what their display values are, and whether any multi-step flows were interrupted. Components render from the store. When a user takes an action (enroll, remove, verify), that's one POST, and the response includes a fresh attachState snapshot so the store stays in sync. The number of fetch calls should be proportional to the number of user actions, not the number of credential types.

`/api/otp` is gone: `SendTurnstile.` and `Enter.` became `OtpSendTurnstile.` and `OtpEnter.` on `/api/credential` (both require a signed-in user — the early-userTag design will later open them to signup), and `FoundEnvelope.` dissolved into `Get.`.

## Current endpoint and store map

**`/api/credential` + `credentialStore`** — the main credential system. Handles Browser, Password, Name, TOTP, and Wallet. Every successful response includes `attachState` (full credential snapshot). Store exposes refs and methods for all credential types. Used by CredentialPanel and its sub-components (SetPasswordForm, TotpPanel, WalletPanel, etc).

Actions: `Get.`, `SignUpAndSignInTurnstile.`, `SignIn.`, `SignOut.`, `SetName.`, `RemoveName.`, `SetPassword.`, `RemovePassword.`, `CheckNameTurnstile.`, `GetPasswordCyclesTurnstile.`, `CloseAccount.`, `TotpEnroll1.`, `TotpEnroll2.`, `TotpRemove.`, `TotpValidate.`, `WalletProve1.`, `WalletProve2.`, `WalletRemove.`, `OauthRemove.`, `OtpSendTurnstile.`, `OtpEnter.`, `EmailRemove.`, `PhoneRemove.` (the OAuth prove flow isn't an action here — it's a browser navigation through `/api/oauth/*`, where the signIn callback writes the row directly)

**Email/phone one-time passwords** ride the same endpoint and store. Challenge state lives in `credentialStore.otps`, and the store is the only code that touches the `useOtpCookie()` cookie: any response that carries `task.otps` also carries `task.envelopeOtp` as the resealed ciphertext, or blank when nothing is live — the store keeps text, and on blank clears the cookie if it's holding one. Text or blank, plus the store's local knowledge of what it holds; no meanings loaded onto null versus undefined. Recovery after refresh rides `Get.`, which reads the cookie's envelope from `body.envelopeOtp` and returns the non-secret display parts, replacing the old `FoundEnvelope.` round trip.

## Note: two cookies, future unification

Right now OTP and TOTP each have their own cookie and envelope: `temporary_envelope_otp` (sealed with action `'Otp.'`) and `temporary_envelope_totp` (sealed with action `'EnrollTotpEnvelope.'`). These exist independently because OTP and TOTP were built at different times. This works but doesn't scale — each new multi-step credential flow shouldn't bring its own cookie.

The future direction is a single `CredentialEnvelope` cookie that can hold in-flight state for multiple credential operations simultaneously — a TOTP enrollment and an OTP verification happening in the same session, stored in one envelope with slots for each. `Get.` now recovers both, as two named body fields: `envelope` (TOTP, keeping its original name) and `envelopeOtp`. That asymmetry is deliberate and temporary — it dissolves when the unified envelope in storage.md lands. `FoundEnvelope.` is gone.

# Envelope and cookie analysis across credential types

## No envelope needed

These credential types are single-step operations with no provisional state.

**Browser** — server sets it on sign-in, done. Uses the httpOnly session cookie (`browserTag`), which is a separate system from enrollment envelopes.

**Name** — one call to set or remove. No multi-step flow.

**Password** — one call. Changing an existing password requires the current password in the same request, but that's validation, not a multi-step flow.

## Envelope needed, cookie-persisted

These are multi-step flows where the user might refresh the page mid-enrollment. The envelope is sealed by the server, stored in a client-readable cookie, and returned by the client on the next step.

**TOTP** — 2-step enrollment. `TotpEnroll1.` generates a secret and seals it in an envelope (action `'EnrollTotpEnvelope.'`). The client stores this in the `temporary_envelope_totp` cookie. `TotpEnroll2.` opens the envelope, validates the user's 6-digit code, and saves the secret. One enrollment per user at a time. Recovery: `Get.` checks for this cookie and reopens the enrollment UI if found.

**OTP** — 2-step challenge (send code, enter code). `OtpSendTurnstile.` generates a code and seals it in an envelope (action `'Otp.'`). The client stores this in the `temporary_envelope_otp` cookie. `OtpEnter.` opens the envelope and validates the user's guess. **Multiple simultaneous challenges** — the envelope holds an array of active challenges. A user signing up might authenticate both their email and phone number at the same time, producing two challenges in one envelope. Recovery: `Get.` opens the cookie's envelope (sent as `body.envelopeOtp`) and returns the non-secret display parts.

Both cookies use `cookieOptions.envelope`: `httpOnly: false` (page script must read for recovery), `sameSite: 'Strict'`, `maxAge: 20 minutes`, `secure` in production.

## Envelope needed, no cookie

These flows use envelopes for tamper-proof state, but the envelope travels a different way — not through a cookie.

**OAuth** — since svelteless, no envelope of ours at all. The flow is a browser navigation run by @auth/core inside the apex worker; the transient state of the dance (CSRF, PKCE) lives in Auth.js's own short-lived internal cookies, and our part begins when the signIn callback writes the credential row directly.

**Wallet** — the envelope stays in the request body. The signing happens in-page via a wallet popup (MetaMask, etc.), so there's no navigation away and no need for cookie persistence.

## Unification direction

The tension: TOTP has one slot per user, but OTP has an array of simultaneous challenges. A unified `CredentialEnvelope` cookie would need to hold both — a TOTP enrollment slot and an OTP challenges array — since a user signing up might be verifying their email (OTP) while also enrolling TOTP in the same session. OAuth and wallet don't need cookies at all, so they stay out of the unified cookie.

# Credential events and audit trail

## Current state: hide does the work, events are underused

`credential_table` has an `event` column defined as: 1 removed, 2 mentioned, 3 challenged, 4 validated. Most credential functions hardcode `event: 4`. Removal uses `queryHide` (sets the `hide` column), which makes rows invisible to `queryGet`. Wallet is the first type to use events 2 and 3 (WalletProve1 writes mentioned and challenged rows).

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

## Pre-user activity: the visitor who acts before signing up

The early userTag isn't only about credentials. The happy paths that matter most start with a person who does something before any signup exists: they favorite a post, follow a creator, close the browser, and come back the next day — and their stars and follows are still there. Amazon trained everyone to expect this shape: a brand-new person fills a cart without being forced through signup, and when they finally check out and sign in, the ephemeral cart and the account merge. We don't have a cart, but favorites and follows are the same pattern — state accumulating for an identity we're tracking, before it belongs to a user we've authenticated.

That's exactly what the early userTag is for. Under "a userTag is an identity we're tracking," pre-signup stars and follows are ordinary rows against the early tag, and signup moves nothing: the tag the person has been using simply acquires proven credentials. The genuinely hard case is the other direction — a visitor accumulates activity as a tracked identity, then signs in to an account that already exists — and now two userTags hold state that needs combining, deliberately and exactly once. The lazy-user flows sketched at the bottom of otp.md (enter a code tomorrow, sign in from a second device without finishing the first) are all variations of this.

These flows matter to the storage decisions, not just to signup: what lives in tables against an early tag versus what the page holds locally before any tag exists is the same question storage.md's relocate-or-eliminate fork asks about provisional credential state. Designing the visitor-first flows may motivate or even decide those choices — get them right early, because they're the front door.

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

**OAuth** (Google, Twitter, Discord, GitHub) — since svelteless, the flow runs on @auth/core directly inside the apex worker: the catch-all at `site/server/api/oauth/[...all].js` owns every url under `/api/oauth/*`, a hidden form POST starts a browser navigation through the provider, and our signIn callback writes the credential row directly, with one-shot `?oauth-done` hints carrying the outcomes that owe the user a word. Provider list in `oauthProviders()` factory keyed off `.env.keys 'oauth, providers, public'`. UI in OauthPanel inside CredentialPanel. Per-row layout: k1=provider tag, k2=identifier, k3=handle, k4=name, k8=stringified `{account, profile, user}` audit blob. Writes event-3 (challenged) when the flow starts and event-4 (validated) in the signIn callback. `credentialOauthGet/Set/Remove/Parse/Challenge`.

**Email/Phone (OTP)** — any number of addresses per user, all peers, no main or default. f0/f1/f2 = normalized/formal/display forms from `validateEmailOrPhone`; type `'Email.'` or `'Phone.'`. Each address's lifecycle is event rows: 2 mentioned, 3 challenged (k1 = provider, `Amazon.`/`Twilio.`, so time-to-validate per provider is queryable), 4 validated — current status is the highest visible event, and remove hides the whole lifecycle. A proven address is held: no other user can be challenged at it or claim it (outcome `Held.`, checked at send and again at enter to close the race where two users held live codes). Otp flows require a signed-in user from send through enter, full stop — each sealed challenge records the userTag that started it, and enter refuses anyone else (outcome `SignedOut.`) — until the early-userTag design opens these flows to signup. Two-step challenge with envelope cookie, multiple simultaneous challenges; all codes are entered in the TopBar `OtpEnterList` box, one enter system for demo and credential flows alike. UI in EmailPanel and PhonePanel. One level3 family does all of it, taking type as a parameter: `credentialOtpSend/Enter/Get/Remove/Holder/Mentioned/Challenged/Validated` (the endpoint resolves the signed-in userTag and passes it down; browserHash stays at the endpoint with the envelope).

## Standalone, planned for integration

(none remaining — OTP was the last, integrated above; `address_table` was steered around rather than migrated, and its cleanup waits for the ledger work)

# Integrating OTP into credential_table

**This landed.** The plan below is kept for the record; where what shipped differs: `FoundEnvelope.` dissolved into `Get.` via a second named body field `envelopeOtp` rather than waiting for the unified envelope; `address_table` was steered around, not migrated; the signup wrinkle resolved for now as "otp flows require a signed-in user, the whole time, as the same user," pending the early-userTag design; and a claim guard shipped with the integration — a proven address returns `Held.` to everyone else, checked at send and at enter.

Before replacing envelope cookies with event-3 rows, the simpler prerequisite is getting OTP into the unified credential system — the same way TOTP, Wallet, and OAuth were integrated. Actions in `/api/credential`, refs and methods in `credentialStore`, UI in `CredentialPanel`, rows in `credential_table`. The envelope/cookie mechanism stays the same for now; we're just consolidating where the logic lives.

## OTP (Email/Phone) — medium effort

The largest integration — OTP has the most moving parts.

**Server.** `/api/otp.js` logic moves into `/api/credential.js`. Actions: `OtpSendTurnstile.`, `OtpEnter.`. `FoundEnvelope.` merges into `Get.` (same pattern as TOTP recovery). `attachState` extends to return validated email/phone credentials (type `'Email.'`/`'Phone.'`, event 4). Rate limiting stays in trail_table.

**Database.** Validated addresses move from `address_table` into `credential_table` (f0=normalized, f1=formal, f2=display). `address_table` can be retired.

**Store.** `pageStore.otps` migrates into `credentialStore`. `useOtpCookie()` stays for now (cookie replacement is a separate later step).

**Components.** OTP components wire into `CredentialPanel`, calling `credentialStore` methods instead of `fetchWorker` directly.

**Wrinkle: the signup flow.** OTP is used both for credential management (signed-in user adds an email) and signup (new person proves address control). The credential endpoint requires a signed-in user for most actions. The signup path needs to work without one — either by making OTP actions available without a user (like `CheckNameTurnstile.` already is), or by creating a userTag early as discussed above.

## Sequencing

Wallet done (see wallet.md for dev panel and test scenarios). OAuth done. OTP done — the architectural questions that remain (signup flow, early userTag assignment, address_table cleanup) carry forward on their own.

## Consumer identity menu (deferred)

Once all credential types are integrated (OAuth and OTP alongside Browser, Name, Password, TOTP, Wallet), the per-type dev panels collapse into a single unified "ways to identify yourself" menu. Discord and X sign-ins alongside MetaMask and WalletConnect wallet connections alongside email/phone OTP alongside TOTP and password, one coherent surface for the user.

Under the hood nothing changes — per-type stores, endpoints, and reconciliation logic carry over unchanged. It's purely a template and UX question. The dev panels (CredentialPanel and its sub-components) stay as a diagnostic tool during integration; replacing them before the underlying credential system is stable would just mean throwing away the replacement.

# Scenario brainstorm: realistic corner cases

Complex-but-realistic scenarios collected ahead of the guards that will handle them. Later these become a test suite — simple and expressive, hitting the scenarios without being pedantic or verbose. The users in these stories are chaotic, not malicious.

## The mistyped address

Alice adds al@gmail.com but never completes the proof — we sent a code, she got sidetracked, the challenge expired. A week later, Alfred enters the same al@gmail.com. We allow it: Alice's unproven mention doesn't reserve the address for her exclusively.

Then Alfred completes validation — and the story rewrites itself. The address was Alfred's all along; Alice had typed her own address wrong. Alfred now holds al@gmail.com as a proven credential. The table still remembers that Alice mentioned it — nothing is erased — but the address belongs to Alfred.

Now Alice, still certain that address is hers, types it again. This time we don't send a code: the address is held by another user's completed proof. We record her mention — the table quietly accumulates evidence that she keeps trying — but no challenge goes out. The first time, we had no reason to doubt her, so we trusted her with a code. This time, we know she's wrong.

The rules this scenario fixes:

- An unproven mention reserves nothing. Only completed proof claims an address.
- A proven claim blocks challenges to that address from *other* users. We record the mention, event 2, and stop there — no code is sent. (The holder herself can still be challenged at her own address — that's re-verification, sudo, or signing in a new device.)
- History survives every turn. Alice's mentions, her expired challenge, Alfred's proof — all of it stays in the table.

A neighboring corner: both users hold live challenges to the same address at once (rate limits allow two back-to-back codes), and Alfred validates first. If the claim check runs only at send time, Alice's still-live code would validate too, and two users would hold proof of the same address. So the check runs at enter time as well as send time — the second validation records the mention and declines the claim.

## Outcomes name remedies, not causes

Users sharing browsers, tabs, and inboxes produce combinatorial chaos, and we can't add a new outcome and a new component branch for every permutation. What keeps the outcome vocabulary bounded is a rule: an outcome names the user's *remedy*, never the internal cause. `Expired.` already collapses at least four causes — timed out, guesses exhausted, replayed envelope, trail mismatch — into one outcome, because the remedy is identical: request a new code. `SignedOut.` collapses not-signed-in, signed-out-mid-flow, and wrong-user-at-a-shared-browser, because the remedy is one sentence. Causes are combinatorial; remedies are few by nature — try again, wait, get a new code, sign in, you can't do that.

Guards follow the same discipline: each is a general invariant that answers scenarios nobody has imagined yet (`Held.` encodes "one holder per address"; `SignedOut.` encodes "same signed-in user, send through enter"), never a check written for one story. And component branches are copy only — the store applies state uniformly, so a new outcome costs one sentence per surface, not new state logic.

There's a security dividend too: causes describe the system and other users, while a remedy describes only what this caller should do next — so a response vocabulary that never names causes can't inadvertently leak how a guard works, why it fired, or facts about other accounts to a malicious caller. The `Held.` oracle below is the one place a remedy unavoidably implies a fact about another user, which is why it gets its own entry.

Red flags that mean this is breaking down: an outcome whose copy needs to vary by cause (remedies were merged wrongly); a component consulting local state to figure out what an outcome meant (ambiguity leaking out of the server); a proposed outcome that names a scenario instead of a rule; the same outcome-to-copy list appearing verbatim in a fourth component (time for a shared map, and not before).

## Three tiers of page response, and where the middle one will live

When a refusal arrives, the page has three tiers of response. A sad path or mild chaos within a valid session gets an in-place notification — the user can act on the remedy right where they are. When the spa catches itself holding session state the server contradicts (a ready button posts, and the server answers SignedOut.), the middle road: end the spa with a full navigation home, rebuilding everything from server truth — short of blowing up with error, but not continuing on state we know is wrong. And when the request is something only our own bug or potential malice could produce: toss, and the error page.

The middle tier isn't a credential thing. A stale tab will eventually click for the next page of a feed too; the detection is the same everywhere (the store believed in a session, the server says there isn't one) and so is the response. So when a second surface needs this, the check moves to the seam every response passes through — fetchWorker, or apply in a store — rather than being copied into component branches. OtpRequestComponent's SignedOut. branch is the first instance and the reference for the pattern. Outcome copy stays per-surface; the stale-session response is surface-independent.

**Known second surface, deferred to its own sprint.** Today every other signed-in credential action still answers the stale tab with tier three: the else-branch in credential.js is `if (!user) toss('state')`, so a stale tab clicking Sign Out — probably the single most likely stale-tab click on the site, after signing out from another device signs you out everywhere — gets the error page, as does Remove Password, TotpRemove, and the rest. That's tier-three punishment for tier-two innocence, and it's the trigger for the site-wide standardization: gate those actions gracefully and move the navigation response to the seam. Two design questions wait there. First, the enter box's SignedOut. currently covers both "no session at the server" (stale — navigate) and "signed in as someone other than the challenge's owner" (consistent state — must not navigate, or a shared browser reload-loops), so a seam-level rule needs those distinguished, probably by splitting the outcome into two remedies. Second, a navigation response living in a store is page-only code in universal territory — the pageStore ttd's warning — so the seam might belong in a component-layer wrapper instead. A sweep of existing full navigations (July 2026) found no other middle-tier instances to convert: everything else that leaves the spa is an external protocol handoff (otpauth:, wallet deep-link), a deliberate teardown into a server flow (the oauth form POST), an error-tier exit (error.vue, error2.vue), or a dev-tool reload button.

## The Held. outcome is a quiet enumeration oracle — recorded, accepted

The notification copy is deliberately vague, but the API response still says `outcome: 'Held.'`, and a signed-in user reading their own network tab can probe addresses one at a time: Held. means registered and proven here, success means unclaimed. Three properties temper it, all by design rather than luck: every probe costs a turnstile solve; probing requires a signed-in account, so it's attributable; and every probe writes an event-2 mention row under the prober's own userTag — an enumeration campaign generates its own evidence trail as it runs, and those mentions are exactly the "confused user keeps typing an address that isn't theirs" record from the mistyped-address scenario above, now doing double duty as audit.

We don't hide the outcome, because making Held. indistinguishable from success would lie to the legitimate case it exists for — Alice, who typed her own address wrong and deserves to be blocked with a word. If probing ever shows up in the mention rows, the guard sketch is credential-level: rate-limit Held. responses per requesting user, and alert on mention-row bursts.
