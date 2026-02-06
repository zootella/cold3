
# TOTP Refactoring Plan

## What we have

Custom RFC 6238 implementation in `icarus/level0.js:1915-2137`, built on native Web Crypto `subtle` API. Written bottom-up in verifiable parts: counter, truncate, generate, validate, enroll. A fuzz test in `icarus/level1.js:1291-1302` cross-checks against the npm `otpauth` module across thousands of random secrets and times.

Production surface is `site/server/api/totp.js`, which imports from icarus:
- `totpEnroll` — generate secret + QR URI for authenticator app setup
- `totpValidate` — check a code against a secret at the current time
- `totpConstants` — rate limiting parameters (guardWrongGuesses, guardHorizon)
- `checkTotpSecret` / `checkTotpCode` — input validation

## Changes

### 1. Merge totpValidate and totpValidateGivenTime

Currently `totpValidate(secret, code)` delegates to `totpValidateGivenTime(secret, code, now)`. Merge into a single function with optional `now`:

```js
export async function totpValidate({secret, code, now = Now()})
```

This is secure because `now` is only reachable by server-side code. The production caller in `totp.js` never passes `now`, so it defaults to `Now()`. No path from the HTTP request to that parameter.

Production call sites in `totp.js` change from `totpValidate(secret, code)` to `totpValidate({secret, code})`.

### 2. Flip the fuzz test direction

Currently the fuzz test generates codes with both implementations and compares. Instead, let the npm module generate and our code validate:

```js
let code = (new otpauth.TOTP({...})).generate({timestamp: t})
ok(await totpValidate({secret: d, code, now: t}))
```

This lets us stop exporting `totpGenerate`. The fuzz coverage is equivalent — we still exercise thousands of random secrets and times through both implementations. The crypto doesn't care which direction the cross-check runs.

### 3. Inline counter and truncate into generate

`totpCounter` and `totpTruncate` were scaffolding — built as separate named functions so each layer could be verified on the way up to the fuzz proof. Now that proof exists, the separate counter and truncate unit tests are redundant with the `totpGenerate` RFC vector tests (same secret, same times, same expected outputs). Inlining them reduces the function count without losing any necessary test coverage.

### 4. Drop redundant tests, keep what the fuzz can't reach

Tests to **drop** (covered by generate-level RFC vectors):
- Separate `totpCounter` tests (line 2000-2009)
- Separate `totpTruncate` tests (line 2022-2034)

Tests to **keep** (the fuzz test cannot reach these):
- RFC vector tests on `totpGenerate` — pin the implementation to the specification itself, not just to a library
- Window validation tests on `totpValidate` — that ±30s is accepted, ±60s is rejected
- Enrollment URI tests — string formatting, parameter encoding, `[ABC]` identifier
- Input validation tests — `checkTotpSecret`, `checkTotpCode`

### 5. Unexport totpGenerate

After flipping the fuzz test direction, `totpGenerate` is no longer called from outside level0. Remove the export. Update the call tree comment to reflect that generate is now fully internal.
