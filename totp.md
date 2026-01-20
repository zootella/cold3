
(this notes document is part of a set; find them all by searching "otp notes")

# TOTP Authentication System

Proves user possesses a device running an authenticator app (Google Authenticator, Authy, etc.) via RFC 6238 time-based codes.

---

## How It Works

1. User initiates enrollment while signed in
2. Server generates a random secret, seals it in an encrypted envelope
3. Page stores envelope in a cookie, displays QR code with otpauth:// URI
4. User scans QR into authenticator app (app now shares the secret)
5. User enters the 6-digit code their app displays
6. Page resubmits envelope + code; server opens envelope, validates code
7. On success, server saves secret to `credential_table`

The envelope pattern eliminates database writes for abandoned enrollments. Most users who start enrollment complete it, but some scan the QR and never come back—those abandoned attempts cost nothing.

---

## The Envelope Pattern

The key insight: provisional state doesn't need a database. The server encrypts it, the page holds it, the page returns it.

**Sealing (Enroll1):** Server generates secret, builds a "letter" containing the secret plus a tamper-detection message, encrypts the letter with a server-only symmetric key, sets an expiration. Returns the opaque envelope to the page.

**Holding:** Page stores the envelope in a cookie. Why a cookie rather than memory? TOTP enrollment involves the user picking up their phone, opening an authenticator app, scanning a QR code. They often swipe-to-refresh impatiently, or their phone tombstones the browser tab. A cookie survives these interruptions. It's encrypted, so exposure is harmless.

**Opening (Enroll2):** Page resubmits the envelope with the user's code. Server decrypts, verifies the action tag matches (prevents using an envelope from a different flow), checks expiration, verifies the tamper-detection message, then validates the code against the secret inside.

This is cleaner than the OTP system's `code_table` approach. If we were redesigning OTP today, we'd use envelopes too—a single cookie holding an array of pending codes, updated each round trip.

---

## Validation (After Enrollment)

Once enrolled, the secret lives in `credential_table`. No envelope needed for validation—just code entry.

1. User enters 6-digit code from their app
2. Server retrieves stored secret from `credential_table` via `credentialTotpGet()`
3. Server checks rate limit: `trailCount()` counts wrong guesses in past 24h. At 6, returns `Later.`
4. Server validates code with ±30 second window—accepts previous, current, or next period to handle clock drift
5. Logs result to `trail_table` via `trailAdd()` for ongoing rate limiting

**Why trail_table instead of a counter?** The trail is append-only logging. Rate limiting queries recent events. This pattern works for any rate-limited action—just change the message string. No per-user counter fields to maintain.

**Why ±1 period?** TOTP assumes clocks are synchronized, but they drift. Accepting the previous and next 30-second periods (±30s total) handles minor drift without compromising security. A code is valid for at most 90 seconds.

---

## Key Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `totpEnroll()` | level0.js | Generate secret and otpauth:// URI |
| `totpValidate()` | level0.js | Check code against secret (±1 period) |
| `totpGenerate()` | level0.js | RFC 6238: counter → HMAC-SHA1 → truncate → 6 digits |
| `sealEnvelope()` | level2.js | Encrypt provisional state for page to hold |
| `openEnvelope()` | level2.js | Decrypt and verify on resubmission |
| `credentialTotpGet/Set` | level3.js | Store/retrieve secret in credential_table |
| `trailCount/Add` | level3.js | Rate limiting via event logging |

---

## Constants

- **Secret:** 20 bytes, base32 encoded
- **Code:** 6 digits, 30-second periods, ±1 window
- **Rate limit:** 6 wrong guesses per 24 hours → ~105 years to 50% brute-force

---

## Frontend

| Component | Purpose |
|-----------|---------|
| `TotpDemo.vue` | Enrollment UI, cookie management, code input |
| `QrCode.vue` | Renders otpauth:// URI as scannable QR |

---

## Compared to OTP

OTP (code_table) and TOTP solve similar problems differently:

| | OTP | TOTP |
|-|-----|------|
| **Secret delivery** | Server sends code via email/SMS | User scans secret into app via QR |
| **Provisional state** | Database row per pending code | Encrypted envelope in cookie |
| **Code lifetime** | 20 minutes | 30 seconds (±1 period) |
| **User friction** | Wait for email/SMS | Already have app open |

TOTP's envelope pattern is cleaner—no database writes for abandoned enrollments. If OTP were redesigned today, it would likely use a single envelope containing an array of pending codes, updated each round trip.

---

## Files

- `site/server/api/totp.js` — endpoint (Status, Enroll1, Enroll2, Validate, Remove)
- `icarus/level0.js` — RFC 6238 implementation
- `icarus/level2.js` — envelope seal/open
- `icarus/level3.js` — credential storage, trail rate limiting
- `site/components/snippet1/TotpDemo.vue` — frontend
