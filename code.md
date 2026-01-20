
(this notes document is part of a set; find them all by searching "otp notes")

# Verification Code System (OTP)

Proves user controls an email address or phone number by sending a short code they must enter.

---

## How It Works

1. User enters their email or phone
2. Server checks rate limits, generates a code, sends it via lambda
3. Server stores hash(codeTag + code) in `code_table`, bound to this browser
4. User receives email/SMS, types the code
5. Server verifies hash matches, marks address as validated

The code itself is never stored—only its hash. The user proves knowledge of the code; the server proves it generated that code for this browser.

---

## Browser Identity

Every browser gets a `browserTag` in an http-only cookie (395 days). The server hashes this to `browserHash` before use. The tag never reaches client JavaScript; the hash never leaves the server. This binds codes to the browser that requested them.

**Functions:** `cookieMiddleware.js` manages the cookie; `hashText()` in level2.js creates the hash.

---

## Sending a Code

When the user requests a code, the server:

1. **Permits** — `codePermit()` checks rate limits against `code_table` history for this address
2. **Composes** — `codeCompose()` generates a random code, its hash, and a visual letter (A-Z)
3. **Sends** — Lambda (`net23/message.js` → `persephone.js`) delivers via Amazon SES/SNS or Twilio
4. **Records** — `code_add()` inserts a row with browserHash, address, hash, and lives=4

The code travels to the user; only its hash reaches the database.

---

## Entering a Code

When the user submits their guess:

1. **Lookup** — `codeEnter()` finds the row by codeTag
2. **Validate browser** — Reject if browserHash doesn't match (attacker intercepted code)
3. **Check expiration** — Reject if 20 minutes have passed
4. **Verify hash** — Compare hash(codeTag + guess) against stored hash
5. **Update lives** — Correct: set lives=0, record validation. Wrong: decrement lives.

---

## Constraints

Each constraint handles a real user scenario. Understanding how they're enforced—where in the code, what schema fields—clarifies how the system holds together.

### 20-Minute Expiration

**Story:** User requests a code, gets sidetracked, returns 30 minutes later. Code rejected.

**Schema:** `row_tick` stores when the code was sent. No separate expiration field—it's computed from `row_tick + Code.expiration`.

**Enforcement:** `codeEnter()` compares `row_tick + Code.expiration` against current time. Also, `browserToCodes()` only queries rows where `row_tick >= now - Code.expiration`, so expired codes don't even appear in the UI.

**To test:** Send a code, wait (or mock time forward), attempt entry. Expect `{success: false, reason: 'Expired.'}`. Also verify `browserToCodes()` returns empty after expiration.

---

### 4 Wrong Guesses

**Story:** User fat-fingers the code repeatedly. After 4 wrong attempts, code dies.

**Schema:** `lives` field starts at 4. Decremented on each wrong guess. At 0, the code is dead.

**Enforcement:** `codeEnter()` decrements `lives` on wrong guess via `code_set_lives()`. Entry is rejected if `!row.lives` (already dead). `browserToCodes()` filters `lives > 0`, hiding dead codes from UI.

**To test:** Send a code, enter wrong guess 4 times. First 3 return `{success: false, reason: 'Wrong.', lives: 3/2/1}`. Fourth returns `lives: 0`. Fifth attempt throws (code is dead). Verify code no longer appears in `browserToCodes()`.

---

### Correct Guess Kills Code

**Story:** User enters correct code. It's consumed immediately—can't be reused.

**Schema:** Same `lives` field. Correct guess sets `lives = 0`.

**Enforcement:** `codeEnter()` calls `code_set_lives({codeTag, lives: 0})` on correct guess, then `browserValidatedAddress()` to record the outcome.

**To test:** Send a code, enter correctly. Returns `{success: true}`. Attempt same code again—throws (dead code). Verify address validation was recorded.

---

### Replacement Kills Old Code

**Story:** User requests a code, doesn't receive it, requests another. First code dies when second is sent.

**Schema:** No explicit "replaced" field. The old code's `lives` is set to 0.

**Enforcement:** `codePermit()` checks for live codes to this address in the past 20 minutes (`rowsLive`). Returns `wouldReplace: codeTag` if found. `codeSent()` calls `code_set_lives({codeTag: permit.wouldReplace, lives: 0})` before recording the new code.

**To test:** Send code A to an address. Send code B to the same address within 20 minutes. Verify code A now has `lives = 0` and doesn't appear in `browserToCodes()`. Code B works normally.

---

### Browser Binding

**Story:** Attacker sees code over victim's shoulder, tries to use it from their own browser. Rejected.

**Schema:** `browser_hash` field stores the SHA-256 hash of the requesting browser's tag.

**Enforcement:** `codeEnter()` compares `row.browser_hash` against the entering browser's hash. Mismatch throws immediately—doesn't even return a nice error, because this indicates tampering.

**To test:** Send a code with browserHash A. Attempt entry with browserHash B. Expect throw/rejection. Same code with browserHash A succeeds.

---

### 24 Codes/Day Hard Limit

**Story:** Attacker (or confused user) hammers an address with code requests all day. After 24, blocked for remainder of 24-hour window.

**Schema:** No counter field. Computed by querying `code_table` for rows matching this address with `row_tick >= now - Code.day`.

**Enforcement:** `codePermit()` queries `code_get_address()`, filters to `rowsDay`, checks `rowsDay.length >= Code.limitHard`. Returns `{success: false, reason: 'CoolHard.'}`.

**To test:** Send 24 codes to one address (may need to mock or bypass soft limit). 25th request returns `CoolHard.`. Wait 24 hours (or mock time), request succeeds again.

---

### 1-Minute Soft Limit

**Story:** User is impatient, clicks "send code" repeatedly. After 2 codes in a 5-day window, must wait 1 minute between subsequent requests.

**Schema:** No counter field. Computed from `code_table` rows with `row_tick >= now - Code.week`.

**Enforcement:** `codePermit()` checks `rowsWeek.length >= Code.limitSoft`. If so, computes `cool = rowsWeek[0].row_tick + Code.minutes`. If `now < cool`, returns `{success: false, reason: 'CoolSoft.'}`.

**To test:** Send 2 codes to an address. Immediately request a third—returns `CoolSoft.`. Wait 1 minute, request succeeds. Note: first 2 codes have no delay between them.

---

### 4→6 Digit Escalation

**Story:** First-time user gets a friendly 4-digit code. Returning user (within 5 days) gets stronger 6-digit codes.

**Schema:** No field. Code length is decided at send time and affects only what's generated and hashed.

**Enforcement:** `codePermit()` returns `useLength: rowsWeek.length < Code.limitStrong ? Code.short : Code.standard`. `codeCompose()` receives this length, generates code of that size.

**To test:** Fresh address receives 4-digit code. Second code to same address (within 5 days) is 6 digits. After 5 days without codes, next code is 4 digits again.

---

### Summary

| Constraint | Schema Field | Checked In | Outcome |
|------------|--------------|------------|---------|
| Expiration | `row_tick` | `codeEnter()`, `browserToCodes()` | Expired. |
| Wrong guesses | `lives` | `codeEnter()` | Wrong., then dead |
| Correct guess | `lives` | `codeEnter()` | lives→0, validated |
| Replacement | `lives` (of old) | `codeSent()` | old lives→0 |
| Browser binding | `browser_hash` | `codeEnter()` | throw |
| Hard limit | (computed) | `codePermit()` | CoolHard. |
| Soft limit | (computed) | `codePermit()` | CoolSoft. |
| Code length | (computed) | `codePermit()` | 4 or 6 digits |

---

## Key Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `codePermit()` | level3.js | Rate limit check, decides code length |
| `codeCompose()` | level3.js | Generate code, hash, visual letter |
| `codeSent()` | level3.js | Record to database, kill replaced code |
| `codeEnter()` | level3.js | Verify guess, update lives |
| `browserToCodes()` | level3.js | Get active codes for display |
| `code_table` schema | level3.js | browserHash, address, hash, lives |

---

## Frontend

| Component | Purpose |
|-----------|---------|
| `CodeRequestComponent.vue` | Address input, provider selector, calls /api/code/send |
| `CodeEnterComponent.vue` | Code input, shows letter and lives remaining |
| `CodeEnterList.vue` | Lists all active codes for this browser |

---

## Security Summary

- **Code never stored** — only hash(codeTag + code)
- **browserTag in http-only cookie** — JavaScript can't read it
- **browserHash never sent to client** — stays server-side
- **Turnstile on send endpoint** — bot protection
- **Analyzed rate limits** — 23.7 years to 50% brute-force success

---

## Files

- `site/server/api/code/send.js`, `enter.js` — endpoints
- `icarus/level3.js` — core logic and code_table schema
- `icarus/level2.js` — browserHash creation
- `net23/src/message.js`, `persephone/persephone.js` — lambda messaging
- `site/components/snippet1/Code*.vue` — frontend
