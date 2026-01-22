
(this notes document is part of a set; find them all by searching "otp notes")

# OTP: Envelope-Based Address Verification

## Start Here

This document describes a refactoring goal: rebuild the email/SMS verification code system without a dedicated database table.

**Before reading this, read these three documents:**

1. **code.md** — The existing `code_table` system. Understand how it works, especially the constraints (expiration, guesses, rate limits, browser binding). This is what we're replacing.

2. **totp.md** — The TOTP system. Shows the envelope pattern: server seals state, page holds it in a cookie, page resubmits with user input.

3. **wallet.md** — The wallet system. Another envelope example, plus trail_table for rate limiting.

**The goal:** Build a new "otp" system matching the functionality in code.md. Same user interface, same security restrictions, same helper functions where sensible—but no `code_table`.

---

## Function Groups in level3.js

Scanning down level3.js, here are groups of functions and how they'll be involved:

### Ignore for now

```
addressRemoved
addressMentioned
addressChallenged
addressValidated
address_add
addressToUser
userToAddress
browserChallengedAddress
browserValidatedAddress
```

These are stub functions for an address table which we'll ignore for now.

### The existing code system (will remain, for reference)

```
codeSend
codePermit
codeCompose
codeSent
browserToCodes
codeEnter
```

This group is the core of the current working code system.

### New otp functions to write alongside

```
otpSend
otpPermit
otpCompose
otpSent
browserToOtp -- actually not sure on this one, as the envelope will be the source of otp codes!
otpEnter
```

These are the new ones for the otp system. Same parameters, same activity, same return shapes. The difference is *how* they take care of business inside.

### Shared: Code constants

```
export const Code = {...}
```

This object defines the restrictions (time, guesses, rate limits) that keep the code system secure. Our otp system should use this same exact object, not duplicate it.

### Will NOT use: code_table and helpers

```
SQL(`CREATE TABLE code_table ...`)
code_get
code_get_browser
code_get_address
code_set_lives
code_add
```

This is the schema and helpers the code system uses. Our new otp system won't touch this table at all—this is the key implementation difference. We're going to get the same system working without a dedicated database table.

### Will use: trail_table

```
trailRecent
trailCount
trailGet
trailGetAny  ← new helper for otp
trailAdd
trailAddMany
```

Trail table is a generalized tool that records proof of an event (any event we can describe in a message string) at a point in time.

For example, to invalidate a nonce:
```
trailAdd(`invalidate nonce ${nonce}`)
```

Then later, `trailGet` that same message to know if the nonce is fresh or already used.

The code system doesn't use trail_table (it uses code_table instead). But trail_table can be very useful for otp—especially for rate limiting queries like "how many codes have we sent to this address recently?"

`trailGetAny(messages, horizon)` queries multiple message hashes in one round trip using SQL `IN` clause. Returns all matching rows; caller filters by hash in application code. This turns 3 queries into 1 for `otpEnter`.

---

## Four Resources for Implementation

At a high level, we can use these resources to make otp functionally equivalent to code without a dedicated database table:

### [A] Envelope

The sealed secret envelope system that totp uses. Server seals an object, page stores it in a cookie (survives refresh), page resubmits it with each action.

For instance: server puts the complete code in the envelope. Page keeps it in a cookie, cannot read it to cheat at guessing. Page submits guess + envelope. Server opens envelope, compares guess with the right answer—sealed, authentic, secret, in the envelope they were holding.

The envelope can hold multiple pending codes as an array, updated each round trip.

### [B] Credential Table

Rows in `credential_table` with numbered events to record the big picture outcomes:
```
event BIGINT NOT NULL  -- 2 mentioned, 3 challenged, 4 validated, 1 removed
```

If we send a code to alice@example.com, we can make a row with event=3 (challenged). If alice enters correctly, add a row with event=4 (validated).

The meaningful large-scale outcomes that the code system keeps in code_table, we can keep in credential_table instead.

**Note:** credential_table assumes a userTag exists. OTP will be used when a new person is signing up, so we need to think about how to use it before a browser has validated an address.

### [C] Trail Table

Discussed above. A generalized way to mark that an event happened. We can use it to see how many times recently we've bothered an address. We can't easily use it to look up what a correct code is for a browserHash—that's what the envelope is for.

It may be mathematically possible to do lookups by recording many different messages, but our aim is to make otp *shorter* (in code, in schema), equivalently secure, and simpler to reason about.

### [D] Simpler Rules (only if necessary)

It's possible that as we design otp, we'll find that some restriction is hard to enforce without a dedicated database table. If so, two options:

1. Make things complicated to offer exact equivalent protection, or
2. Discard or simplify that rule

We can talk about simplifying if the system as a whole remains secure. Some of the finer-grained rules (4→6 digit escalation, soft vs hard rate limits) may contribute greatly to complexity but not meaningfully to user experience or security.

---

## Proposed Design: Envelope + Trail Table

### The Envelope

Held by the page in a cookie. The envelope system handles sealing, expiration, and tamper detection automatically. Inside:

```json
{
  "browserHash": "a1b2c3d4e5f6...",
  "challenges": [
    {
      "tag": "Xk9mPq2RfJ4nBvC8sL1w",
      "code": "847291",
      "letter": "K",
      "lives": 4,
      "start": 1705678900000,
      "address": "alice@example.com",
      "type": "Email."
    },
    {
      "tag": "Yp3nWs8TgH6mDxE2qR9v",
      "code": "5932",
      "letter": "M",
      "lives": 3,
      "start": 1705679100000,
      "address": "+15551234567",
      "type": "Phone."
    }
  ]
}
```

- `browserHash` — verified against submitting browser on resubmit
- `tag` — unique identifier for this challenge
- `code` — the actual code (envelope is sealed, so plaintext is fine)
- `letter` — visual letter A-Z (stored, not computed)
- `lives` — remaining guesses (decremented in envelope on wrong guess)
- `start` — when created, trusted server clock (for 20-minute expiration check)
- `address` — email/phone (for display and finding replacements)
- `type` — "Email." or "Phone."

Most users will have 0-1 challenges. A security-conscious user might have 2 (email + phone). The example shows 2 to illustrate the structure.

**Why store the actual code?** Unlike code_table (which stores a hash because the database is readable), the envelope is sealed with a server-only key. The page holds it but can't read or tamper with it. Storing the plaintext code is simpler—no hashing on verify, just string comparison.

### Four Trail Messages

```
sent code to ${address}
opened challenge ${tag}
closed challenge ${tag}
wrong guess on challenge ${tag}
```

Each is hashed and recorded with a timestamp. We query these to enforce constraints.

---

### Flow: Send Code (`otpSend`)

**Inputs:** address, provider, existing envelope (if any)

**Rate limit check (1 query):**
- `trailGet(`sent code to ${address}`, 5 days)` — returns all rows for this message in past 5 days
- Application code filters to check:
  - Count in last 24h < 24 (hard limit)
  - If count in 5 days >= 2, most recent must be > 1 minute ago (soft limit)
  - Count in 5 days determines code length (4 vs 6 digits)

**Replacement (envelope only, no query):**
- Open envelope, find any existing challenge to this address
- If found: `trailAdd(`closed challenge ${oldTag}`)` — invalidate it

**Create challenge (add):**
- Generate tag, code, hash, letter
- `trailAdd(`opened challenge ${tag}`)`
- `trailAdd(`sent code to ${address}`)`

**Update envelope:**
- Remove old challenge to this address (if any)
- Add new challenge to array
- Seal and return

**Totals: 1 read, 2-3 writes**

---

### Flow: Enter Code (`otpEnter`)

**Inputs:** tag, guess, envelope

**Find challenge:**
- Open envelope, verify browserHash matches submitting browser
- Find challenge by tag
- If browserHash mismatch or challenge not found: reject

**Validity checks (1 query with `trailGetAny`):**

Instead of 3 separate queries, use a helper that queries multiple message hashes in one round trip:

```javascript
let rows = await trailGetAny([
  `opened challenge ${tag}`,
  `closed challenge ${tag}`,
  `wrong guess on challenge ${tag}`
], 20 * Time.minute)
```

Then in application code, separate the results:
- `opened` — must exist, must be < 20 min old
- `closed` — must NOT exist
- `wrongCount` — must be < 4

This uses SQL `IN` clause: `WHERE hash IN ($1, $2, $3) AND row_tick > $4`. Postgres handles this efficiently with the existing `trail2` index.

**Verify guess:**
- Compare hash(tag + guess) against challenge.hash

**If correct (add):**
- `trailAdd(`closed challenge ${tag}`)`
- Record validation (credential_table)
- Remove challenge from envelope array
- Seal and return success

**If wrong (add):**
- `trailAdd(`wrong guess on challenge ${tag}`)`
- Decrement `lives` in envelope (for UI on next request)
- Seal and return failure with remaining guesses

**Totals: 1 read, 1-2 writes**

---

### Flow: Get Active Challenges

With code_table, `browserToCodes(browserHash)` queries the database to find active codes—the database is the source of truth.

With otp, the envelope *is* the source of truth. It arrives with the request as a cookie. Any endpoint can open it and see pending challenges. There's no lookup to perform.

This could be a helper function for symmetry (`browserToOtp`), or just inline logic wherever needed. Either way: open envelope, return challenges array, done.

**Should we validate on display?** We could query trail_table to check each challenge is still valid (not closed, not expired, not out of guesses). But simpler: just return them, let `otpEnter` reject stale ones. The UI might show a challenge that's secretly dead, but the user finds out immediately when they try to enter.

**This is a major advantage over code_table.** Currently, every new tab queries `browserToCodes()` to check for active codes. With otp, if the envelope is empty (the common case—most users have no pending codes), there's no database query at all. The server just opens the envelope, sees it's empty, done.

---

### Constraint Enforcement Summary

| Constraint | How enforced |
|------------|--------------|
| 20-minute expiration | `start` in envelope, checked against current time |
| 4 wrong guesses | `trailGetAny` result, count rows with wrong guess hash |
| Correct guess kills code | `trailAdd(`closed challenge ${tag}`)` |
| Replacement kills old | Find in envelope by address, `trailAdd(`closed challenge ${oldTag}`)` |
| Browser binding | browserHash in envelope, verified against submitting browser on resubmit |
| 24 codes/day hard limit | 1 query: `trailGet(`sent code to ${address}`, 5 days)`, filter in app |
| 1-minute soft limit | Same query, check most recent timestamp in app |
| 4→6 digit escalation | Same query, count rows in app |

---

### Database Operation Summary

| Flow | DB Round Trips | Trail Rows Added |
|------|----------------|------------------|
| Send code | 2 | 2-3 |
| Enter code | 2 | 1 |
| Get active challenges | 0 | 0 | (envelope only) |

**Send code:**
- `trailGet` (1 round trip) — rate limit check
- `trailAddMany` (1 round trip) — adds 2-3 rows:
  - `opened challenge ${tag}`
  - `sent code to ${address}`
  - `closed challenge ${oldTag}` (only if replacing)

**Enter code:**
- `trailGetAny` (1 round trip) — checks opened/closed/wrong in one query
- `trailAdd` (1 round trip) — adds 1 row:
  - Correct: `closed challenge ${tag}` (+ credential_table write)
  - Wrong: `wrong guess on challenge ${tag}`

**Get active challenges:** Just opens the envelope. No database at all when empty (the common case).

---

---

## Before Implementation

A few things to resolve or be aware of:

### ~~trailGetMulti doesn't exist yet~~ ✓ Done

Implemented as `trailGetAny(messages, horizon)` in level3.js. Uses `queryGetAny` in level2.js which supports SQL `IN` clause. Returns all matching rows; caller filters by hash in application code.

### credential_table assumes a userTag

The document mentions recording validation in credential_table, but credential_table assumes a userTag exists. OTP is often used during signup, before a user exists. Options:

1. Don't record to credential_table until user is created, then backfill
2. Create a provisional userTag at code-send time
3. Use a different mechanism for pre-signup validation tracking

This needs a decision.

### Envelope expiration vs challenge expiration

Both use 20 minutes, but measured differently:

- **Envelope:** 20 minutes from last seal (resets on every interaction)
- **Challenge:** 20 minutes from `start` (never resets)

The envelope can outlive challenges inside it (if re-sealed on wrong guesses), but that's fine—challenge expiration is enforced by checking `start`, not by the envelope disappearing. A dead envelope can't contain live challenges, but a live envelope can contain dead challenges that get rejected on entry.

### Code constants

The shared `Code` object in level3.js defines all the timing and limit constants. Read it before implementing—otp should use these same values, not duplicate them.

---

## What Success Looks Like

- `code_table` can be dropped from the schema
- All eight constraints from code.md still enforced (or consciously simplified)
- Code is shorter and easier to reason about
- User experience identical
