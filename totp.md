
(this notes document is part of a set; find them all by searching "otp notes")

# TOTP Authentication System

Time-based One-Time Password (RFC 6238) for second-factor authentication.

## Overview

User scans a QR code with their authenticator app (Google Authenticator, Authy, etc.). The app generates a new 6-digit code every 30 seconds. User enters the code to prove they have the device.

**Key design:** No dedicated database table for provisional state. The server seals an encrypted envelope containing the secret; the page holds it in a cookie and resubmits it to complete enrollment.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
│  ├─ Cookie: temporary_envelope_totp (20 min, not http-only)     │
│  ├─ TotpDemo.vue  →  POST /api/totp                             │
│  └─ QrCode.vue    →  renders otpauth:// URI                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Nuxt Server                                                    │
│  └─ api/totp.js: Status, Enroll1, Enroll2, Validate, Remove     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  icarus/                                                        │
│  ├─ level0.js: totpEnroll, totpValidate, totpGenerate (RFC6238) │
│  ├─ level2.js: sealEnvelope, openEnvelope                       │
│  └─ level3.js: credentialTotpGet/Set/Remove, trailCount/Add     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Database                                                       │
│  ├─ credential_table: stores secret (type='Totp.', k1=secret)   │
│  └─ trail_table: logs right/wrong guesses for rate limiting     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sealed Envelope Pattern

Instead of storing provisional enrollment state in a database table, the server:

1. **Seals** an envelope containing the secret and a verification message
2. **Returns** the envelope to the page
3. **Page stores** envelope in a short-lived cookie
4. **Page resubmits** envelope with the user's code guess
5. **Server opens** envelope, verifies contents, validates code

This eliminates database writes for abandoned enrollments.

### Seal (Enroll1)

```javascript
// site/server/api/totp.js:48
let envelope = await sealEnvelope('EnrollTotp.', Limit.expirationUser, {
  secret,
  message: safefill`TOTP enrollment: browser ${browserHash}, user ${userTag}, secret ${secret}`,
})
```

### Open (Enroll2)

```javascript
// site/server/api/totp.js:58-70
let letter = await openEnvelope('EnrollTotp.', body.envelope)
if (!hasTextSame(letter.message, safefill`TOTP enrollment: browser ${browserHash}, user ${userTag}, secret ${letter.secret}`))
  return {outcome: 'BadMessage.'}  // tampered
```

### Envelope Implementation

**Location:** `icarus/level2.js:380-408`

```javascript
export async function sealEnvelope(action, duration, letter) {
  letter.action = action
  letter.expiration = Now() + duration
  let symmetric = encryptSymmetric(cutAfterLast(Key('envelope, secret'), '_'))
  let envelope = await symmetric.encryptObject(letter)
  return envelope
}

export async function openEnvelope(action, envelope, options) {
  let symmetric = encryptSymmetric(cutAfterLast(Key('envelope, secret'), '_'))
  let letter = await symmetric.decryptObject(envelope)
  checkTextSame(action, letter.action)  // prevents cross-action replay
  if (!options?.skipExpirationCheck && isExpired(letter.expiration))
    toss('expired')
  return letter
}
```

---

## Cookie Storage

**Location:** `site/components/snippet1/TotpDemo.vue:10-17`

```javascript
const refCookie = useCookie('temporary_envelope_totp', {
  maxAge: Limit.expirationUser / Time.second,  // 20 minutes
  sameSite: 'strict',
  secure: isCloud(),
  path: '/',
  httpOnly: false,  // page script needs to read it
})
```

**Why a cookie?** TOTP enrollment commonly involves:
- User scanning QR code on phone
- User swiping down to refresh page (impatient)
- Phone tombstoning browser tab to save memory

A cookie survives these interruptions. The envelope is encrypted, so exposure is safe.

---

## Constants

**Location:** `icarus/level0.js:1940-1953`

```javascript
totpConstants = {
  secretSize: 20,           // bytes, base32 encoded
  algorithm: 'SHA1',        // RFC 6238 standard
  codeLength: 6,            // digits
  period: 30,               // seconds
  window: 1,                // accept ±1 periods (±30s)
  guardWrongGuesses: 6,     // max wrong guesses per day
  guardHorizon: 86400000,   // 24 hours
}
```

---

## Enrollment Flow

### Step 1: Enroll1

**Location:** `site/server/api/totp.js:41-53`

1. Verify user is signed in (`credentialBrowserGet`)
2. Verify not already enrolled (`credentialTotpGet`)
3. Generate random 20-byte secret (`totpSecret`)
4. Build otpauth:// URI for QR code
5. Seal envelope with secret + verification message
6. Return `{enrollment: {uri, envelope}}`

### Step 2: User Scans QR Code

The otpauth:// URI format:

```
otpauth://totp/{issuer}:{label}?secret={base32}&algorithm=SHA1&digits=6&period=30&issuer={issuer}
```

User scans with authenticator app, which stores secret and starts generating codes.

### Step 3: Enroll2

**Location:** `site/server/api/totp.js:57-78`

1. Open envelope, verify action and expiration
2. Verify message matches (proves no tampering)
3. Validate code against secret (`totpValidate`)
4. Save secret to `credential_table` (`credentialTotpSet`)
5. Return `{outcome: 'Enrolled.'}`

---

## Validation Flow

**Location:** `site/server/api/totp.js:82-107`

For signed-in users with TOTP enrolled:

1. Check rate limit: `trailCount('TOTP wrong guess: secret ${secret}', 24h)`
2. If >= 6 wrong guesses in 24h, return `{outcome: 'Later.'}`
3. Validate code with ±30s window (`totpValidate`)
4. Log result to trail_table
5. Return `{outcome: 'Valid.'}` or `{outcome: 'Invalid.'}`

---

## Rate Limiting

Uses `trail_table` for logging, not a dedicated counter.

**Location:** `icarus/level3.js:1345-1366`

```javascript
let n = await trailCount(
  safefill`TOTP wrong guess: secret ${secret}`,
  totpConstants.guardHorizon  // 24 hours
)
if (n >= totpConstants.guardWrongGuesses) return {outcome: 'Later.'}
```

**Security analysis (from source):**
- 6 wrong guesses per 24 hours
- 1M possible codes (6 digits)
- 50% success probability: ~105 years

---

## Secret Storage

**Location:** `icarus/level3.js:238-253`

TOTP uses the existing `credential_table` with:
- `type_text = 'Totp.'`
- `k1_text = secret` (base32)
- `event = 4` (active/validated)

```javascript
export async function credentialTotpGet({userTag}) {
  let rows = await queryGet('credential_table', {
    user_tag: userTag, type_text: 'Totp.', event: 4
  })
  return rows[0]?.k1_text || false
}

export async function credentialTotpSet({userTag, secret}) {
  await queryHide('credential_table', {user_tag: userTag, type_text: 'Totp.'})
  await credentialSet({userTag, type: 'Totp.', event: 4, k1: secret})
}
```

---

## RFC 6238 Implementation

**Location:** `icarus/level0.js:1775-1852`

```javascript
// Generate code for given time
function totpGenerate(secret, t) {
  let counter = totpCounter(t)          // 8-byte counter from timestamp
  let hmac = hmacSha1(secret, counter)  // HMAC-SHA1
  return totpTruncate(hmac, 6)          // Dynamic truncation → 6 digits
}

// Validate with ±1 period window
function totpValidateGivenTime(secret, code, now) {
  let t = Math.floor(now / 1000)
  for (let i = -1; i <= 1; i++) {
    if (totpGenerate(secret, (t + i * 30) * 1000) === code)
      return true
  }
  return false
}
```

---

## File Index

| Component | File | Lines |
|-----------|------|-------|
| API endpoint | `site/server/api/totp.js` | 1-117 |
| TOTP logic | `icarus/level0.js` | 1775-1890 |
| Constants | `icarus/level0.js` | 1940-1953 |
| Envelope seal/open | `icarus/level2.js` | 380-408 |
| Secret storage | `icarus/level3.js` | 238-253 |
| Trail rate limiting | `icarus/level3.js` | 1345-1395 |
| Vue component | `site/components/snippet1/TotpDemo.vue` | 1-145 |
| QR code renderer | `site/components/small/QrCode.vue` | 1-90 |

---

## Comparison to OTP (code_table)

| Aspect | OTP (code_table) | TOTP |
|--------|------------------|------|
| Secret location | Server generates, sends via email/SMS | Server generates, user scans into app |
| Provisional state | Database row | Encrypted envelope in cookie |
| Code validity | 20 minutes | 30 seconds (±1 period) |
| Rate limit | Per-address (24/day hard, 1min soft) | Per-secret (6 wrong/day) |
| Requires | Email or phone | Authenticator app |
| Database table | code_table (dedicated) | credential_table (shared) |
