
(this notes document is part of a set; find them all by searching "otp notes")

# Verification Code System

This document describes the verification code flow used for proving user ownership of an email address or phone number.

## Overview

The user types an address they control (email or phone). The system sends a short code. When the user enters the code correctly, the server has proof that the user at the browser controls that address.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
│  ├─ Cookie: browserTag (http-only, 395 days)                    │
│  ├─ CodeRequestComponent.vue  →  POST /api/code/send            │
│  └─ CodeEnterComponent.vue    →  POST /api/code/enter           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Nuxt Server (site/server/)                                     │
│  ├─ cookieMiddleware.js: extracts browserTag from cookie        │
│  ├─ api/code/send.js: validates input, calls codeSend()         │
│  └─ api/code/enter.js: validates input, calls codeEnter()       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  icarus/level2.js & level3.js (core logic)                      │
│  ├─ browserTag → browserHash (SHA-256)                          │
│  ├─ codeSend(): permit check, compose code, call lambda, record │
│  ├─ codeEnter(): validate, check expiration, verify hash        │
│  └─ browserToCodes(): retrieve live codes for browser           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Lambda: net23/src/message.js                                   │
│  └─ persephone.js: sends via Amazon SES/SNS or Twilio           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Database: code_table                                           │
│  └─ Stores: browserHash, address, hash(codeTag+code), lives     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### code_table

**Location:** `icarus/level3.js:955-978`

```sql
CREATE TABLE code_table (
  row_tag        CHAR(21)  NOT NULL PRIMARY KEY,  -- uniquely identifies the row, also the code tag
  row_tick       BIGINT    NOT NULL,              -- timestamp when code was sent
  hide           BIGINT    NOT NULL,              -- not used; set lives to 0 instead to revoke

  browser_hash   CHAR(52)  NOT NULL,  -- hashed browser identifier

  provider_text  TEXT      NOT NULL,  -- "Amazon." or "Twilio."
  type_text      TEXT      NOT NULL,  -- "Email." or "Phone."
  address0_text  TEXT      NOT NULL,  -- normalized address
  address1_text  TEXT      NOT NULL,  -- API/formal address
  address2_text  TEXT      NOT NULL,  -- display address

  hash           CHAR(52)  NOT NULL,  -- hash(codeTag + codeCandidate)
  lives          BIGINT    NOT NULL   -- guesses remaining (starts at 4)
);

CREATE INDEX code1 ON code_table (browser_hash, row_tick DESC) WHERE hide = 0;
CREATE INDEX code2 ON code_table (type_text, address0_text, row_tick DESC) WHERE hide = 0;
```

---

## browserTag and browserHash

### Cookie (Client-Side)

**Location:** `site/server/middleware/cookieMiddleware.js`

- **Name:** `__Secure-current_session_password` (cloud) or `current_session_password` (local)
- **Value:** `account_access_code_DO_NOT_SHARE_` + tag
- **Lifespan:** 395 days (under Chrome's 400-day cap), refreshed on every visit
- **Flags:** HttpOnly, Secure, SameSite=Lax

### Hash (Server-Side)

**Location:** `icarus/level2.js:729`

```javascript
let browserHash = await hashText(checkTag(door.workerEvent.context.browserTag))
```

The browserTag is never sent to client code; only the hash is used internally. This prevents untrusted page JavaScript from learning the browser's identity.

---

## Constraints: User Stories and Enforcement

Each constraint exists to handle a specific user scenario. This section details each boundary, the user story it addresses, and exactly where in the source code it is created and enforced.

### Constants Reference

**Location:** `icarus/level3.js:915-953`

```javascript
export const Code = {
  expiration: 20*Time.minute,  guesses: 4,
  limitHard: 24,  day: Time.day,
  limitSoft: 2,  week: 5*Time.day,  minutes: 1*Time.minute,
  limitStong: 1,  short: 4,  standard: 6,
  alphabet: 'ABCDEFHJKMNPQRTUVWXYZ',
}
```

---

### 1. Time Expiration (20 minutes)

**User Story:** User requests a verification code, gets sidetracked by a phone call, returns to the page 30 minutes later, and types in the code from their email. The system rejects it because the window has closed.

**Why it exists:** Limits the attack window. A code intercepted by an attacker is only useful for 20 minutes.

**Constant:**
```javascript
expiration: 20*Time.minute  // icarus/level3.js:917
```

**Created:** When the code is sent, `row_tick` is set to current timestamp.
```javascript
// icarus/level3.js:997-1006
async function code_add({codeTag, browserHash, provider, type, v, hash, lives}) {
  await queryAddRow({table: 'code_table', row: {
    row_tag: codeTag,
    // row_tick is automatically set to Now() by queryAddRow
    ...
  }})
}
```

**Enforced at entry:** When user submits a code, check if it's expired.
```javascript
// icarus/level3.js:877-878
if (row.row_tick + Code.expiration < now) {
  return {success: false, reason: 'Expired.', lives: 0}
}
```

**Enforced at retrieval:** When fetching active codes to display to user, exclude expired ones.
```javascript
// icarus/level3.js:841-842
let rows = await queryTopSinceMatchGreater({table: 'code_table',
  since: Now() - Code.expiration,  // only codes from past 20 minutes
  ...
})
```

---

### 2. Wrong Guess Limit (4 guesses)

**User Story:** User misreads the code in their email (maybe "8" looked like "6"), types it wrong, tries again, makes another typo, and after 4 failed attempts the code is dead and they must request a new one.

**Why it exists:** Prevents brute-force guessing. With 4 guesses on a 4-digit code, an attacker has a 4/10000 = 0.04% chance per code.

**Constant:**
```javascript
guesses: 4  // icarus/level3.js:918
```

**Created:** When code is recorded, lives is initialized to 4.
```javascript
// icarus/level3.js:836
await code_add({..., lives: Code.guesses})
```

**Enforced on wrong guess:** Decrement lives; user can try again if lives > 0.
```javascript
// icarus/level3.js:891-895
} else {  // wrong guess
  let lives = row.lives - 1
  await code_set_lives({codeTag, lives})
  return {success: false, reason: 'Wrong.', lives}
}
```

**Enforced on entry attempt:** Reject if code has no lives remaining.
```javascript
// icarus/level3.js:873-874
if (!row || row.browser_hash != browserHash || !row.lives) {
  toss('page', {...})  // no lives = code is dead
}
```

**Enforced at retrieval:** Don't show dead codes to user.
```javascript
// icarus/level3.js:844
title2: 'lives', cell2GreaterThan: 0,  // only codes with lives remaining
```

---

### 3. Correct Guess Consumes Code

**User Story:** User correctly enters their code. The code is immediately invalidated so it cannot be reused, and the address is marked as validated.

**Why it exists:** One-time use. Prevents replay attacks if someone later obtains the code.

**Enforced:**
```javascript
// icarus/level3.js:881-889
if (hasTextSame(row.hash, await hashText(codeTag+codeCandidate))) {  // correct
  await code_set_lives({codeTag, lives: 0})  // kill the code
  await browserValidatedAddress({...})        // record the validation
  return {success: true, lives: 0}
}
```

---

### 4. Replacement Invalidation

**User Story:** User requests a code, email is slow to arrive, user gets impatient and requests another code. The first code is invalidated when the second is sent, so the user doesn't accidentally verify with the old one.

**Why it exists:** Ensures only the most recent code is valid. Prevents confusion and limits attack surface.

**Detected at permit:** Check for active code to the same address.
```javascript
// icarus/level3.js:789,803
let rowsLive = rowsDay.filter(row => row.row_tick >= now - Code.expiration)
...
wouldReplace: (rowsLive.length && rowsLive[0].lives) ? rowsLive[0].row_tag : false
```

**Enforced at send:** Kill the old code before recording the new one.
```javascript
// icarus/level3.js:828-830
if (permit.wouldReplace) {
  await code_set_lives({codeTag: permit.wouldReplace, lives: 0})
}
```

---

### 5. Browser Binding

**User Story:** Attacker intercepts a code sent to victim's email (e.g., via shoulder-surfing or email compromise). Attacker tries to enter the code from their own computer. The system rejects it because the code is bound to the victim's browser.

**Why it exists:** The code proves control of both the address AND continuity of the browser session.

**Created:** Code is stored with the requesting browser's hash.
```javascript
// icarus/level3.js:1000
browser_hash: browserHash,
```

**Enforced:**
```javascript
// icarus/level3.js:873
if (!row || row.browser_hash != browserHash || !row.lives) {
  toss('page', {...})  // wrong browser = reject
}
```

---

### 6. Hard Rate Limit (24 codes per address per day)

**User Story:** An attacker or confused user hammers the same email address all day, requesting code after code. After 24 codes in 24 hours, the system blocks further requests to protect the address owner from spam and the system from abuse.

**Why it exists:** Prevents email/SMS bombing an address. Hard stop regardless of timing.

**Constants:**
```javascript
limitHard: 24,       // icarus/level3.js:920
day:       Time.day, // icarus/level3.js:921
```

**Enforced:**
```javascript
// icarus/level3.js:786-792
let rows = await code_get_address({address0})
let rowsWeek = rows.filter(row => row.row_tick >= now - Code.week)
let rowsDay = rowsWeek.filter(row => row.row_tick >= now - Code.day)

if (rowsDay.length >= Code.limitHard) {
  return {success: false, reason: 'CoolHard.'}
}
```

---

### 7. Soft Rate Limit (1 minute cooldown after 2 codes)

**User Story:** User is impatient. They request a code, don't see it immediately, click "send code" again. After the second code in a 5-day window, the system requires a 1-minute pause between subsequent requests.

**Why it exists:** Slows down rapid-fire requests without completely blocking legitimate users who need a few retries.

**Constants:**
```javascript
limitSoft: 2,             // icarus/level3.js:923
week:      5*Time.day,    // icarus/level3.js:924
minutes:   1*Time.minute, // icarus/level3.js:925
```

**Enforced:**
```javascript
// icarus/level3.js:795-798
if (rowsWeek.length >= Code.limitSoft) {
  let cool = rowsWeek[0].row_tick + Code.minutes  // when cooldown ends
  if (now < cool) return {success: false, reason: 'CoolSoft.'}
}
```

---

### 8. Code Length Escalation (4 digits → 6 digits)

**User Story:** New user signs up, enters their email. First code is a friendly 4-digit "1234" that's easy to type. If they request another code within 5 days (maybe they're testing, or setting up a second device), subsequent codes are 6 digits for increased security.

**Why it exists:** Balance UX vs security. First-time users get convenience; repeated requests get stronger codes to defeat statistical attacks.

**Constants:**
```javascript
limitStong: 1,   // icarus/level3.js:927 (note: typo "Stong" in source)
short:      4,   // icarus/level3.js:928
standard:   6,   // icarus/level3.js:929
```

**Decided at permit:**
```javascript
// icarus/level3.js:802
useLength: rowsWeek.length < Code.limitStong ? Code.short : Code.standard,
```

**Applied at composition:**
```javascript
// icarus/level3.js:813
c.code = randomCode(length)  // length is 4 or 6 based on permit decision
```

**Security analysis (from source comments):**
```
4-digit code with 4 guesses every 5 days:
  50% chance after ~6930 guesses = ~23.7 years

6-digit code with 4 guesses every hour:
  50% chance after ~693000 guesses = ~19.8 years
```

---

## Code Lifecycle

### 1. Permit Check

**Location:** `icarus/level3.js:782-805`

Before sending, check if the address is rate-limited:

```javascript
async function codePermit(address0) {
  let rows = await code_get_address({address0})
  let rowsWeek = rows.filter(row >= now - Code.week)      // Past 5 days
  let rowsDay = rowsWeek.filter(row >= now - Code.day)    // Past 24 hours

  // Hard limit: 24 in 24 hours → CoolHard.
  if (rowsDay.length >= Code.limitHard)
    return {success: false, reason: 'CoolHard.'}

  // Soft limit: 2 in 5 days → require 1 minute gap
  if (rowsWeek.length >= Code.limitSoft) {
    let cool = rowsWeek[0].row_tick + Code.minutes
    if (now < cool)
      return {success: false, reason: 'CoolSoft.'}
  }

  return {
    success: true,
    useLength: rowsWeek.length < Code.limitStrong ? Code.short : Code.standard,
    wouldReplace: // tag of code that will be invalidated if one exists
  }
}
```

### 2. Code Composition

**Location:** `icarus/level3.js:808-823`

```javascript
async function codeCompose({length, sticker}) {
  let c = {}
  c.codeTag = Tag()                              // Unique 21-char identifier
  c.letter = await hashToLetter(c.codeTag, Code.alphabet)  // Visual letter A-Z
  c.code = randomCode(length)                    // 4 or 6 digit numeric code
  c.hash = await hashText(c.codeTag + c.code)   // Hash for verification
  c.subjectText = `Code ${c.letter} ${c.code} for ${Key('message brand')}`
  // messageText and messageHtml built with warning text
  return c
}
```

### 3. Send Message

**Location:** `net23/src/message.js` → `persephone/persephone.js:88-167`

The lambda supports 4 provider/service combinations:
- Amazon SES (email)
- Amazon SNS (SMS)
- Twilio SendGrid (email)
- Twilio SMS

### 4. Record Code

**Location:** `icarus/level3.js:825-837`

Insert row into code_table with:
- browserHash
- provider, type, address (3 forms)
- hash(codeTag + code)
- lives = 4

### 5. Code Entry & Verification

**Location:** `icarus/level3.js:867-897`

```javascript
export async function codeEnter({browserHash, codeTag, codeCandidate}) {
  let row = await code_get({codeTag})

  // Reject if: no row, wrong browser, no lives remaining
  if (!row || row.browser_hash != browserHash || !row.lives)
    toss('page')

  // Check expiration
  if (row.row_tick + Code.expiration < now)
    return {success: false, reason: 'Expired.', lives: 0}

  // Verify guess
  if (hasTextSame(row.hash, await hashText(codeTag + codeCandidate))) {
    // CORRECT
    await code_set_lives({codeTag, lives: 0})  // Consume code
    await browserValidatedAddress({...})        // Record validation
    return {success: true, lives: 0}
  } else {
    // WRONG
    let lives = row.lives - 1
    await code_set_lives({codeTag, lives})
    return {success: false, reason: 'Wrong.', lives}
  }
}
```

---

## Invalidation Rules

Codes are invalidated by setting `lives = 0`:

| Trigger | When |
|---------|------|
| Correct guess | User enters correct code |
| Wrong guesses exhausted | 4 wrong attempts |
| Replacement | New code sent for same address while this one is live |
| Expiration | 20 minutes elapsed (checked on entry, row not deleted) |

---

## Retrieval for Browser

**Location:** `icarus/level3.js:840-864`

`browserToCodes({browserHash})` returns active codes for display:

```javascript
// Only returns codes where:
// - row_tick >= now - 20 minutes (not expired)
// - browser_hash matches
// - lives > 0 (not consumed)

// Each code includes:
{
  tag,         // code identifier
  tick,        // send timestamp
  lives,       // guesses remaining
  letter,      // visual A-Z letter
  addressType, // "Email." or "Phone."
  address0,    // normalized
  address1,    // API form
  address2,    // display form
}
// NOTE: hash is NOT sent (server secret)
```

---

## Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| CodeRequestComponent.vue | `site/components/snippet1/` | Email/phone input, provider selector, POST to /api/code/send |
| CodeEnterComponent.vue | `site/components/snippet1/` | Code input with letter display, lives remaining |
| CodeEnterList.vue | `site/components/snippet1/` | Lists all active codes for current browser |

---

## API Endpoints

### POST /api/code/send

**Location:** `site/server/api/code/send.js`

**Protected by:** Cloudflare Turnstile

**Input:**
```json
{
  "address": "user@example.com",
  "provider": "Amazon"
}
```

**Responses:**
- Success: returns updated codes list
- `CoolSoft.`: must wait 1 minute
- `CoolHard.`: blocked for 24 hours

### POST /api/code/enter

**Location:** `site/server/api/code/enter.js`

**Input:**
```json
{
  "codeTag": "...",
  "codeCandidate": "123456"
}
```

**Responses:**
- `{success: true}`: address validated
- `{success: false, reason: 'Wrong.', lives: N}`: wrong guess
- `{success: false, reason: 'Expired.'}`: code expired

---

## Security Design

| Feature | Purpose |
|---------|---------|
| browserHash hashing | Browser tag never sent to client; only hash used server-side |
| Code hash verification | hash(codeTag + code) kept server-side; code itself never stored |
| HTTP-only cookie | Prevents JavaScript from reading browserTag |
| Rate limiting | Hard (24/day) and soft (1 min after 2/5days) limits |
| 4 guesses | Cryptographically analyzed: 19.8 years brute force on 4-digit code |
| 20-minute expiration | Short window minimizes exposure |
| Turnstile | Bot protection on code send endpoint |
| Per-browser binding | All codes linked to specific browserHash |

---

## File Index

| Component | File | Lines |
|-----------|------|-------|
| Database schema | `icarus/level3.js` | 955-978 |
| Code constants | `icarus/level3.js` | 915-953 |
| Code permit | `icarus/level3.js` | 782-805 |
| Code compose | `icarus/level3.js` | 808-823 |
| Code send logic | `icarus/level3.js` | 825-837 |
| Code enter logic | `icarus/level3.js` | 867-897 |
| Browser to codes | `icarus/level3.js` | 840-864 |
| Browser hash creation | `icarus/level2.js` | 729 |
| Cookie middleware | `site/server/middleware/cookieMiddleware.js` | 1-56 |
| API: send | `site/server/api/code/send.js` | 1-32 |
| API: enter | `site/server/api/code/enter.js` | 1-23 |
| Lambda handler | `net23/src/message.js` | 1-23 |
| Message sending | `net23/persephone/persephone.js` | 88-167 |
| Frontend: request | `site/components/snippet1/CodeRequestComponent.vue` | - |
| Frontend: enter | `site/components/snippet1/CodeEnterComponent.vue` | - |
| Frontend: list | `site/components/snippet1/CodeEnterList.vue` | - |
