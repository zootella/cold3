# credential map

Sketching the current situation completely and correctly before changing anything: which credential types have provisional state, where that state is stored now, and what's the same and different between them. This first section is the list of concerns — the questions to ask about each credential type — followed by facts about the system and stories about flows that shape the answers.

## Credential concerns

Questions to ask about each credential type, one at a time.

**Will we eventually want to let new visitors sign up with this credential?**
For instance, TOTP only helps an existing user additionally secure their account — it's a second factor, never a first. But someone might sign up with OAuth and then add their email, or instead sign up with email and then add their OAuth.

**Does the prove flow need the page to hold server state? (currently in an envelope)**
For instance, Wallet: prove step 1 seals the SIWE nonce into an envelope, and the server needs the page to hold it and send it back alongside the signed message in step 2 — but we don't need to worry about a browser refresh, because a refresh kills the wallet connection and pending popup anyway, so no envelope of ours could resume the flow; the user restarts with one invisible click.

**Does the prove flow need that state to survive a browser reload? (currently by envelope in a cookie)**
For instance, TOTP: by the time the page holds the sealed enrollment secret, the user has already scanned the QR code into their authenticator app. If a reload discards the secret, the entry they just created in their app is orphaned — regeneration is expensive and user-visible. OTP is the same shape: the code already landed in a real inbox, and discarding the challenge invalidates a code the user is about to type, forcing a resend into the rate limits.

**Does the flow involve starting information we should record as mentioned or challenged? (with event 2 and 3 rows)**
For instance, if the server uses Twilio to send an OTP code to alice@example.com, we want a record of that even if Alice never completes the flow — this helps us understand whether Alice, or Twilio, is broken or untrustworthy.

**Can a user hold one, or any number, of this type of credential?**
For instance, a user holds zero or one TOTP enrollment, but any number of proven email addresses and phone numbers. In-flight proofs follow the same multiplicity: one TOTP enrollment in flight, several live OTP challenges at once — though never more than one per address, since a resend replaces the older challenge. The one case where an in-flight proof doesn't correspond to a new credential slot is re-verification — the holder re-challenged at her own already-proven address for sudo or a new device — but even there the one-per-address rule holds.

**Must a proof flow start and finish at the same browser?**
Today the answer is yes for every type. For instance, OTP: request a code from your laptop, and even if you read the email on your phone, the code must be typed back into the laptop, because the challenge lives at the browser that started it. The imaginable alternative — start a proof on one device, finish it on another — is supported nowhere today, and single-browser is simpler and more secure. The question per type is whether that ever needs to change.

**Where is this flow's expiration enforced?**
Provisional state must die on its own in tens of minutes — the concern is who checks the clock. For instance, TOTP: the deadline is baked inside the sealed envelope, so only the server can read it and only the server enforces it. The page can hold a stale envelope indefinitely, and finds out only when the server answers Expired.

## System concerns

Facts about users and browsers that any design has to survive.

- Users can sign up, sign out, and sign in again.
- Users will commonly have more than one device, browser, or browser profile.
- Two users can share the same browser profile: Alice signs out, and then Bob signs in. Anything parked in the browser has to keep their state separate — Bob must not see or disturb Alice's in-flight flows, and Alice expects hers back when she returns.

## Flow concerns

- We should allow users to begin simple flows before making them sign up. For instance, a friendly and uncommon presentation allows a visitor to follow or star something, and her state is saved in that browser. When she returns to the home page the following day (necessarily using the same browser), it shows posts by the creators she followed, and she can click to see her stars or bookmarks. She never signed up. Then, later, she signs up, and her follows, bookmarks, and stars maintain. More common on the web today (and perhaps easier to code) is this: a visitor clicks follow, is sent into the sign-up flow, doesn't have time for this, closes the tab and never returns. Also: The hard case hiding inside that story is the other direction: a visitor accumulates activity as a tracked identity, then signs in to an account that already exists — and now two identities hold state that needs combining, deliberately and exactly once.

## Credential types

Every credential type in the system, plus what remains outside the stack, plus the types our notes mention but we aren't building for v1.

**The seven integrated types.** Since July 2026, every credential type lives in the unified stack — rows in credential_table, actions on `/api/credential`, refs in credentialStore, UI in CredentialPanel. The `type_text` strings in the table are the ground truth:

- **Browser** (`Browser.`) — the sign-in session itself; an event-4 row ties a userTag to a browserHash.
- **Name** (`Name.`) — the username in three forms: f0 normalized for routes, f1 formal, f2 display.
- **Password** (`Password.`) — k1 holds the hash, k2 the cycles; the page runs pbkdf2 before sending.
- **TOTP** (`Totp.`) — authenticator app enrollment; k1 holds the base32 secret.
- **Wallet** (`Ethereum.`) — a proven Ethereum address via Sign-In with Ethereum. The type string names the chain, so a second chain would arrive as a sibling type, not a change to this one.
- **OAuth** (`Oauth.`) — one type for every provider, k1 carrying the provider tag; Google, Twitter, Discord, and GitHub are configured today, and adding a provider is a configuration change, not a new type. (Twitch appears in the grid tests only as the fixture proving unlisted providers get filtered out.)
- **Email and Phone** (`Email.`, `Phone.`) — two type strings sharing the one OTP mechanism; any number held, all peers with no main or default.

**Nothing credential-shaped floats outside the stack anymore.** What's left in the site workspace is remnants and demo UI, not parallel systems: `address_table` and `service_table` schemas and their surrounding functions sit deprecated in level3 awaiting deletion (level3's own July note says credential_table has superseded them; cleanup waits for the ledger work); `site/server/api/signin.js` is a stub that answers only `Hi.`, its old sign-in actions commented out; and the demo components (PasswordDemo's hashing playground, the page4 otp box) are demonstration UI over integrated types.

**Mentioned in notes, not planned for v1.** To cover everything:

- **Passkeys** (WebAuthn/CTAP/FIDO2) — appear once, in `icarus/user.txt`, inside an early sketch that argued against passwords partly because the passkey standard has become a Google-versus-Apple battle that traps users in the middle. That sketch's "no passwords at all" decision predates the Password type that shipped, and passkeys remain unplanned.
- **Backup codes** — explicitly declined in a note in `icarus/core.js`: they're not part of the TOTP standard, and account recovery will lean on the user's other credentials as factors instead.
- **Date of birth** — floated in user.txt as pre-verification matching information for the lazy-signup flow, then dismissed in the same note in favor of requiring the code on the second device. Revived July 2026: the one-thumb signup design pairs DOB with the phone number as its knowledge factor.
- **Other blockchains** — implied only by the `Ethereum.` type naming; no note names one.
- **Turnstile** — deliberately not a credential type: it gates some actions as a bot check but proves nothing durable about a person.
- **browserTag cookie** — also not a type of its own: the httpOnly cookie is the transport under the Browser credential.
