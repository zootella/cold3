# brownie — built and occupied

The brownie is built, swept, and holding its first resident: TOTP enrollment state moved in from the `temporary_envelope_totp` cookie, which is retired. This document works forward from that point. (Its predecessor, storage.md, held the design derivation — why off cookies, the key-format debates, the reconciliations — and retired when the design became code.)

## [1] what the brownie is

cold3 has no session object — the worker in the middle holds nothing, and every request re-derives who is asking from the browserTag cookie and a credential_table lookup. The brownie is our one deliberate cheat in the session direction: a localStorage entry per user, holding a single sealed envelope of in-flight credential state — more convenient than the database, no longer welcome in a cookie. It is not a sign-in (the httpOnly browserTag cookie remains the only session credential, and the server refuses a brownie whose owner isn't the signed-in user), and it does not keep a user signed in. Beyond credentials, the same container is ready for future tenants with user-at-a-browser scoping — sudo elevation (an hour, or a single command) is the clearest candidate.

The localStorage key is three parts joined by dots:

```
brownie.DWFWM4UEAFDLYRFAYI42YLEO7ZONVOT36AJM7TAKOY5BSN3HE3OQ.1784764575418
```

`brownie.` claims the namespace; the middle is `hashText(userTag)`, hashed so one user of a shared profile can't read another's tag out of devtools; the last is the epoch of the overall shelf life, mirrored out from the expiration sealed inside. The page enforces the shelf life by deletion: an expired brownie is deleted on sight — at spa start for any user, at read for the current one — never sent up just so the server can discover that everything inside has expired. The server still enforces the sealed expirations for anything that does arrive, so a tampered epoch changes nothing about security. The value is the bare base62 ciphertext, opaque to the page.

The letter inside — only the server can create and read it — carries `action: 'Brownie.'` and `expiration` (both stamped by sealEnvelope), `userTag` and `browserHash` (the identity the endpoint checks at open), and `items`: an array of self-describing objects, each with a `type` like `'Totp.'`, its own `expiration`, and whatever its flow needs. The items array is a dumb list; per-type multiplicity rules live in flow code. The container's expiration is the latest of its items, so the key's epoch and the sealed deadline agree.

## [2] the protocol

**Up.** The page attaches its brownie ciphertext to the body of a relevant POST. The server opens it (`openLetterBrownie` in `site/server/api/credential.js`): authentic, this browser (openEnvelope's browserHash check), this user (`letter.userTag` against the signed-in user), expired items filtered out on open. Replay is answered by the trail table and credential rows being the truth; cross-play fails the identity checks before items are read.

**Down.** Text or blank, no meanings on null versus undefined. A response that touched the brownie carries `task.brownie` and `task.brownieExpiration` (`attachLetterBrownie`); blank means the last item died and the page deletes its entry — the server never seals an empty items array, because blank *is* empty. Blank is also the only delete command. Sign-out is not a blank trigger: the brownie belongs to the user, not the session, and waits sealed for their return. A response without the field didn't touch the brownie, and the page leaves storage alone.

**Storage rules.** Each user has at most one brownie at a time: a POST sends the current one if held, the server replies with a new one, and the page replaces the previous with the new, always — so the only way a browser holds several is several users sharing one profile, each mid-flow. Because the epoch lives in the key, a reseal that moves the deadline arrives under a new key name (the write lands first, then what it replaced is removed); one that doesn't lands on the same key and overwrites atomically. Readers never remember a key — they scan `brownie.<hash>.` fresh at each use, and finding more than one entry under a hash means the invariant broke, so the reader wipes rather than guessing which is current. Once per spa, the startup sweep deletes expired and malformed entries across all users — localStorage is page territory, a real trust boundary, so defensive parsing there is load-bearing (`textToInt` in a try/catch, not bare `Number`).

## [3] the pieces in the code

- `site/app/stores/brownieStore.js` — the standalone client-only store, the only place our code uses localStorage: `mounted()` (the sweep), `getBrownie({userTag})`, `setBrownie({userTag, envelope, expiration})`. No state, no refs; callers read fresh at each use.
- `site/app/app.vue` — two client-only hooks beside mainStore's: `brownieStore.mounted()` (sweep) and `credentialStore.mounted()` (recovery follow-up).
- `site/server/api/credential.js` — `openLetterBrownie`/`attachLetterBrownie` beside their otp letter twins; the totp actions use them, and `Get.` accepts `body.brownie` for recovery.
- `site/app/stores/credentialStore.js` — asks brownieStore for ciphertext when building totp bodies, applies `task.brownie`/`task.brownieExpiration` in `apply()`, and owns `mounted()`: the client-only follow-up that sends the brownie up after mount, only when one exists.
- `icarus/level3.js` — the totp flows (`credentialTotpEnroll1/Enroll2/Recover`) take the letter and work with items, the same shape as `credentialOtpSend/Enter`, with grid tests walking enrollment, binding, expiration, and recovery through letters directly.

## [4] totp, the first resident

What moved: the enrollment secret now rides as a `{type: 'Totp.', expiration, secret}` item in the letter, and the `temporary_envelope_totp` cookie, `useTotpCookie()`, and the `'EnrollTotpEnvelope.'` action are gone. The letter-level identity (userTag + browserHash, sealed and checked) replaced the old sealed binding message, and the per-user localStorage key handles the shared-browser story at the storage layer — Bob's page never even sends Alice's brownie.

What changed shape in the lifecycle:

- **Recovery is a client-only follow-up.** Cookies were SSR-readable, so recovery used to paint with the page; localStorage is not, so `credentialStore.mounted()` posts the brownie after mount and the store's `enrollment` ref fills in a beat later. TotpPanel watches the ref instead of reading it once at mount. The accepted cost is a brief flash on the rare mid-enrollment refresh; the common no-brownie case costs zero extra requests. (Wrapping the recovery UI in `<ClientOnly>` so SSR renders neither state was weighed and rejected — it adds layout shift and isn't clearly better.)
- **Cancel is a server action.** The page can't delete one item locally without destroying its co-tenants, so backing out posts `TotpEnrollCancel.`: the server drops the totp item and answers with the resealed letter, or blank.
- **Sad paths carry the letter too.** A wrong code keeps the item for retry (same deadline, same key, atomic overwrite); an expired or cancelled enrollment leaves the letter and the page deletes on blank.

## [5] what's next: otp, and the fork

OTP's challenge envelope still lives in the `temporary_envelope_otp` cookie, and its future is the open fork: **relocate** into the brownie as items beside totp's, or **eliminate** into credential_table event-3 rows, decided case by case. The cookie itself retires under either arm, for the reasons that moved totp: a sealed blob the server never reads from a header rides every same-origin request doing no useful work, and the ~dozen simultaneous challenges that fill the browser's 4KB cookie ceiling are a limit counted nowhere, failing at the browser instead of in our code. OTP is the strongest candidate for rows — server-generated, short-lived, already half-recorded in the table (mention and challenge rows exist, challenges record provider and owner), leaving eliminate's marginal cost at storing the answer in the row plus expiration-by-row_tick and cancellation rules. For relocate: sealing is stateless (no insert per challenge), codes stay encrypted at rest, and expiration stays enforced in one sealed place. The brownie exists either way, so the fork decides tenancy, not construction. `Get.` still reads `body.envelopeOtp` beside `body.brownie` — that asymmetry dissolves when the fork resolves.

Further out: if a second consumer beyond credentials arrives (sudo), carrying the brownie moves from credentialStore's bodies to the wide seam — every POST through fetchWorker, opened uniformly by doorWorker into `door.brownie` — deliberate ambient context, the same discipline as the middle-tier navigation precedent: the first instance lives locally, the seam move waits for the second surface.

## [6] open questions

**The early userTag.** Every flow today has a signed-in user, so per-user keying is satisfied; the moment a pre-authentication person gets a tag (Option D commits to "early") is deferred with the signup-phase work. The storage layer only requires a tag by the time code touches the brownie.

**Cross-tab reactivity.** Tabs share the brownie and read fresh at each use, which is safe (a stale post is just the replay case the flows defend). The `storage` event could push updates between tabs; not subscribed today, add when a real flow benefits.

**The sudo item.** Shapes itself when it arrives — a type, an expiration, and whatever the elevated action needs. The items array means waiting costs nothing.
