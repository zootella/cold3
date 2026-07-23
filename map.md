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
- **Wallet** (`Ethereum.`) — proven Ethereum addresses via Sign-In with Ethereum, up to two of them, and no two users can hold the same one. The type string names the chain, so a second chain would arrive as a sibling type, not a change to this one.
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

# The grid

The concerns above, answered type by type, one column at a time. This first pass covers four of the seven types — `Oauth.`, `Ethereum.`, `Email.`/`Phone.`, and `Totp.` — the four whose prove flow involves a party outside our page-and-server pair: a provider, a wallet, an inbox or handset, an authenticator app. That is also exactly the set with multi-step flows and provisional state, which is why they belong together. Browser, Name, and Password are single calls and join the grid later.

## Signup: will we let new visitors sign up with this credential?

Yes for OAuth, Wallet, and Email/Phone. No for TOTP.

This whole column is aspirational. Today all four require a signed-in user before anything happens: the oauth signIn callback denies with `if (!signedIn) return false` in `site/server/api/oauth/[...all].js`, otp answers a graceful `SignedOut.` at both `OtpSendTurnstile.` and `OtpEnter.`, and wallet and totp sit behind the `if (!user) toss('state')` else-branch that guards every remaining action in `site/server/api/credential.js`. Opening these to signup is the work; the add-a-credential-to-an-existing-account direction is what runs now.

The criterion behind the answers is whether the flow is one this credential's likely users have already completed many times elsewhere. A familiar flow arrives with the user's own folk rules attached — don't read the code to whoever just called you, check which account you're signed into — and those are defenses we get for free and could not install ourselves at any price.

**OAuth** — yes. It is among the most-completed authentication rituals of the mobile era, so the expectation is universal. A brand-new visitor signs up straight through the provider, and an existing user who authenticates by email can run the same flow to prove they are somebody at Twitter, ending with two credentials, which is better for them and for us.

**Wallet** — yes, on population-relative terms. Connect-and-sign is unfamiliar to nearly everyone and completely routine to crypto-native users, who are the only people who would reach for that door, and they arrive with their own folk rules about what a signature request should say.

**Email and Phone** — yes. The one-time code to an address is the workhorse of the era and the expectation is as universal as oauth's.

**TOTP** — no, by choice rather than by nature. Nothing structural forbids it: name plus TOTP would be the same shape as the name-plus-password signup already built, an identifier to type beside a secret to re-present. We decline for three reasons, in ascending order of weight. It is the highest-friction possible first step, demanding an app install and a QR scan before an account exists. A TOTP-only account leaves us no channel to reach the person, so no sign-in alert and no recovery. And users hold a strong *contrary* expectation — the authenticator app is the step that comes after you are identified — so offering it as a first credential would overwrite a correct model with a bespoke one, which leaves a user worse defended than an unfamiliar flow does.

## Quantity: how many of this credential can one user hold?

Zero is acceptable everywhere. No credential type is required, and none is more fundamental or authoritative than another — within this group the types are peers. The limits below are chosen rather than forced, and each one is enforced somewhere specific in the code.

**OAuth** — one per provider, any number of providers. Enforced by check 1 in `credentialOauthSet`, which returns `OauthAlreadyLinked.` and writes nothing. A user wanting a different Twitter account cannot add a second; they remove the current link and then add the new one, and the grid test beneath that function walks exactly that path.

**Wallet** — zero, one, or two, held as peers with no main or default. `walletConstants.limit` is 2, and `credentialWalletRefusal` in `icarus/level3.js` enforces it, along with the one-holder rule and a check against re-proving an address the user already holds. Two rather than one because it is the smallest limit that lets a wallet-only user rotate keys in the safe order — add the new wallet, confirm it, then retire the old — where a limit of one would force remove-then-add and leave a failed second proof standing on nothing but a browser session. Two rather than unlimited because wallets are free to mint by the thousand where real addresses are not, and because a proven wallet is a sign-in credential with no channel attached: nobody notices a stale one being used, and a key that leaks years later still opens the account, so the count of live keys should stay small and known.

**Email and Phone** — any number, all peers, with no main or default. Nothing in the code caps them, deliberately: a user should add a personal address alongside an organizational one, so that losing the organization does not lose the account. Holding several also carries its own reassurance, because an address proven here cannot be claimed by anyone else.

**TOTP** — one. Enforced twice over: `credentialTotpSet` hides the previous row before inserting, and both `credentialTotpEnroll1` and `credentialTotpEnroll2` refuse outright when the user is already enrolled.

**Two enforcement styles, and TOTP is the outlier.** Wallet and OAuth both answer a caller who asks for one too many with a graceful outcome, writing nothing: `WalletFull.` and `WalletClaimedElsewhere.` for wallet, `OauthAlreadyLinked.` and `OauthClaimedElsewhere.` for oauth. TOTP instead tosses, so a second enrollment attempt lands on the error page. The realistic trigger for all of these is a panel that rendered before another tab changed something, which is tier-two innocence getting a tier-three answer, so totp's toss is the one left to reconsider whenever stale-tab handling gets standardized across the signed-in credential actions.

**Where wallet's limit is enforced, and why in two places.** Both prove steps ask `credentialWalletRefusal`. `credentialWalletProve1` asks before any nonce is minted, so a user is never sent to their wallet to sign for a proof we would decline at the end — the signature request itself is the expensive, alarming thing, and a doomed flow should never reach it. `credentialWalletProve2` asks again through `credentialWalletSet`, because the minutes a user spends signing are long enough for another tab to fill the last slot or another account to claim the address. Both live in `icarus/level3.js` rather than at the endpoint, so nothing can reach the table around them and a grid test can walk the whole flow. The event-2 mention row is written before the refusal check, the way an otp mention is, so a refused attempt still leaves its trace.

**No floor, yet.** Every remove action is available unconditionally, so a user can remove their name, password, totp, wallet, oauth links, and every address while remaining signed in on the Browser row alone — and then signing out closes the door behind them. The safeguard against emptying an account into an unreachable state is not built.

**Proven addresses are unlimited but simultaneous challenges are not.** Every live otp challenge rides in one sealed envelope in one cookie, and the note inside `credentialOtpSend` puts about a dozen of them at the browser's 4KiB cookie limit. Nothing counts them, so the ceiling is real but unenforced, and reaching it fails at the browser rather than in our code. This is a property of where provisional state lives today, so the storage fork decides it.
