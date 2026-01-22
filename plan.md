
(this notes document is part of a set; find them all by searching "otp notes")

# OTP Implementation Plan

This document describes the component architecture and request flows for the new envelope-based OTP system.

---

## Files

### `site/server/api/otp.js`

Server endpoint handling all OTP actions: `Send.`, `FoundEnvelope.`, `Enter.`.

Already exists with test actions `Seal.` and `Open.`. Will expand to full implementation.

### `site/components/snippet1/OtpEnterList.vue`

Lives in TopBar, always renders. Checks for cookie on mount and watches for changes.

- No cookie → renders nothing
- Cookie exists → calls `FoundEnvelope.` → displays list of challenges
- Loops challenges, renders an OtpEnterComponent for each

Combines "check for cookie" and "display list" into one component (no separate OtpEnterList needed).

### `site/components/snippet1/OtpEnterComponent.vue`

Single challenge entry UI. Receives challenge as prop (tag, letter, address, type, lives).

- Displays: letter, address, lives remaining
- Input: code guess
- Button: calls `Enter.` with envelope + tag + guess
- On response: emits event to parent (OtpEnterList) to update cookie

### `site/components/snippet1/OtpRequestComponent.vue`

User-facing component for requesting codes. Lives on pages like signup, settings, add address.

- Input: email or phone
- Input: provider (for routing to email vs SMS)
- Button: calls `Send.` with address + existing envelope (if any)
- On response: stores new envelope in cookie, OtpEnterList reacts via Vue reactivity

### `site/components/bars/TopBar.vue`

Already exists. Modify to include OtpEnterList:

```vue
<NotificationList v-show="pageStore.notifications.length" />
<CodeEnterList    v-show="mainStore.codes.length" />
<OtpEnterList />
```

---

## Server Actions (otp.js)

### `Send.`

Request a verification code be sent to an address.

**Input:** `{action: 'Send.', address, envelope?}`

**Server does:**
1. Rate limit check via trailGet(`sent code to ${address}`)
2. If envelope provided, open it, check for existing challenge to same address (replacement)
3. Generate challenge: tag, code, letter, lives=4, start=now, address, type
4. Seal envelope: `{browserHash, challenges: [...]}`
5. Send email/SMS via lambda
6. Record to trail: `opened challenge ${tag}`, `sent code to ${address}`
7. If replacing: `closed challenge ${oldTag}`

**Returns:** `{outcome: 'Sent.', envelope}`

### `FoundEnvelope.`

OtpEnterList found a cookie and needs to know what challenges exist.

**Input:** `{action: 'FoundEnvelope.', envelope}`

**Server does:**
1. Open envelope, verify browserHash matches
2. Check expiration
3. Return challenges array (for display, not the actual codes)

**Returns:** `{outcome: 'Found.', challenges: [{tag, letter, address, type, lives, start}, ...]}`

Note: Does NOT return the actual codes, just display info.

### `Enter.`

Submit a guess for a challenge.

**Input:** `{action: 'Enter.', envelope, tag, guess}`

**Server does:**
1. Open envelope, verify browserHash
2. Find challenge by tag
3. trailGetAny: check opened (must exist), closed (must NOT exist), wrong count (<4)
4. Compare guess to code in envelope
5. If correct: trailAdd `closed challenge ${tag}`, remove from challenges, re-seal
6. If wrong: trailAdd `wrong guess on challenge ${tag}`, decrement lives in envelope, re-seal

**Returns (correct):** `{outcome: 'Correct.', envelope}` (or `envelope: null` if no challenges left)

**Returns (wrong):** `{outcome: 'Wrong.', envelope, lives}`

---

## Flows

### Happy Path: SPA, No Refresh

```
1. Page loads
   - TopBar renders OtpEnterList
   - OtpEnterList: cookie empty, renders nothing
   - OtpRequestComponent on page, ready for input

2. User requests code
   - Types email into OtpRequestComponent
   - OtpRequestComponent: fetchWorker('/api/otp', {action: 'Send.', address: '...'})

3. Server handles Send.
   - Rate limit check
   - Generate challenge
   - Seal envelope with browserHash + challenges
   - Send email
   - Return {outcome: 'Sent.', envelope}

4. OtpRequestComponent receives response
   - refCookie.value = response.envelope

5. OtpEnterList reacts (Vue reactivity)
   - Cookie now has value
   - fetchWorker('/api/otp', {action: 'FoundEnvelope.', envelope})
   - Receives challenges array
   - Renders entry UI: shows letter, address, lives

6. User enters code
   - Types code into OtpEnterList input
   - OtpEnterList: fetchWorker('/api/otp', {action: 'Enter.', envelope, tag, guess})

7. Server handles Enter.
   - Verify browserHash, check trail, compare guess
   - If correct: close in trail, remove from envelope, re-seal
   - Return {outcome: 'Correct.', envelope}

8. OtpEnterList updates
   - refCookie.value = response.envelope (or null if empty)
   - Challenge disappears from UI
```

### Refresh Case

User completed steps 1-4, then refreshed the page.

```
1. Page loads (fresh)
   - TopBar renders OtpEnterList
   - OtpEnterList: cookie EXISTS (persisted from before refresh)
   - OtpEnterList: fetchWorker('/api/otp', {action: 'FoundEnvelope.', envelope})
   - Receives challenges array
   - Renders entry UI

2. Continue from step 6 above
```

### Expired/Invalid Envelope

```
1. OtpEnterList mounts, cookie exists
2. OtpEnterList: fetchWorker('/api/otp', {action: 'FoundEnvelope.', envelope})
3. Server returns {outcome: 'Expired.'} or {outcome: 'WrongBrowser.'}
4. OtpEnterList: refCookie.value = null (clear stale cookie)
5. OtpEnterList renders nothing
```

### Multi-Challenge Flow: 0 → 1 → 2 → 1 → 0

Shows how challenges accumulate and clear, including cookie cleanup at the end.

```
STATE: No cookie, no challenges
       OtpEnterList renders nothing

1. User sends code to email
   - OtpRequestComponent: Send. to alice@example.com
   - Server creates envelope: {challenges: [emailChallenge]}
   - OtpRequestComponent: refCookie.value = envelope
   - OtpEnterList reacts, calls FoundEnvelope., shows 1 challenge

STATE: Cookie exists, 1 challenge (email)
       OtpEnterList shows: [K] alice@example.com

2. User sends code to phone (without completing email)
   - OtpRequestComponent: Send. to +1555... with existing envelope
   - Server opens envelope, adds phone challenge: {challenges: [emailChallenge, phoneChallenge]}
   - OtpRequestComponent: refCookie.value = newEnvelope
   - OtpEnterList reacts, calls FoundEnvelope., shows 2 challenges

STATE: Cookie exists, 2 challenges (email + phone)
       OtpEnterList shows: [K] alice@example.com
                     [M] +1555...

3. User enters email code correctly
   - OtpEnterList: Enter. with emailChallenge.tag
   - Server removes email from challenges, re-seals: {challenges: [phoneChallenge]}
   - Returns {outcome: 'Correct.', envelope: newEnvelope}
   - OtpEnterList: refCookie.value = response.envelope
   - OtpEnterList updates local state, shows 1 challenge

STATE: Cookie exists, 1 challenge (phone)
       OtpEnterList shows: [M] +1555...

4. User enters phone code correctly
   - OtpEnterList: Enter. with phoneChallenge.tag
   - Server removes phone, challenges array now empty
   - Returns {outcome: 'Correct.', envelope: null}  ← KEY: null when empty
   - OtpEnterList: refCookie.value = null  ← CLEARS THE COOKIE
   - OtpEnterList: refChallenges becomes empty, renders nothing

STATE: No cookie, no challenges
       OtpEnterList renders nothing
```

**Key detail:** When the last challenge is completed, server returns `envelope: null`. OtpEnterList sets `refCookie.value = null`, which clears the cookie. OtpEnterList then has no challenges to display and renders nothing.

---

## No Pinia Store Needed

This design works entirely through the cookie and Vue reactivity:

- **OtpRequestComponent** and **OtpEnterList** both use `useCookie('temporary_envelope_otp')`
- Vue's `useCookie()` returns a reactive ref
- When OtpRequestComponent sets `refCookie.value`, OtpEnterList sees the change
- The cookie is the coordination mechanism, not a store

This is simpler than the current code system which uses `mainStore.codes`. We don't need:
- No `mainStore.challenges` or similar
- No store actions to add/remove challenges
- No store initialization in `/api/load`

The envelope in the cookie IS the state.

---

## Cookie Details

```javascript
useCookie('temporary_envelope_otp', {
  maxAge: Limit.expirationUser / Time.second,  // 20 minutes
  sameSite: 'strict',
  secure: isCloud(),
  path: '/',
  httpOnly: false,  // JS can read (to check existence) but value is encrypted
})
```

- Browser automatically deletes after 20 minutes of inactivity
- `httpOnly: false` lets Vue components check if cookie exists
- Value is encrypted envelope, components can't read contents
- Both OtpEnterList and OtpRequestComponent use same `useCookie()` call, Vue reactivity syncs them

---

## Envelope Contents

```json
{
  "action": "Otp.",
  "expiration": 1705680100000,
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
    }
  ]
}
```

**Added by sealEnvelope automatically:**
- `action`: checked on open to prevent cross-flow attacks (e.g., using a wallet envelope for OTP)
- `expiration`: timestamp, checked on open (server rejects expired envelopes)

**Added by our code:**
- `browserHash`: verified against submitting browser on every request
- `challenges`: array of pending codes (usually 0-1, max ~2)
- `code`: plaintext in envelope (safe because encrypted with server-only key)

## Three Expirations

There are three different time-based expirations at play:

| What | Set When | Resets? | Purpose |
|------|----------|---------|---------|
| Cookie maxAge | Each cookie write | Yes, on every write | Browser deletes cookie after 20 min inactivity |
| Envelope expiration | Each seal | Yes, on every re-seal | Server rejects stale envelopes |
| Challenge start | Challenge created | Never | Individual challenge expires 20 min after `start` |

The cookie and envelope expirations reset on each interaction (because we re-seal and re-write). But each challenge's `start` is fixed when created—a challenge is dead 20 minutes after its `start`, regardless of envelope activity.

---

## What OtpEnterList Returns to Display

When OtpEnterList calls `FoundEnvelope.`, server returns challenges WITHOUT the actual codes:

```json
{
  "outcome": "Found.",
  "challenges": [
    {
      "tag": "Xk9mPq2RfJ4nBvC8sL1w",
      "letter": "K",
      "lives": 4,
      "start": 1705678900000,
      "address": "alice@example.com",
      "type": "Email."
    }
  ]
}
```

This is what OtpEnterList needs to render the UI: which address, which letter to show, how many lives remain.

---

## Questions / To Decide

1. **Vue reactivity**: Will OtpEnterList's `useCookie()` react when OtpRequestComponent sets the same cookie? Need to verify.

2. **Multiple challenges**: User has email challenge, requests phone challenge. Does `Send.` add to existing envelope or replace?

3. **OtpRequestComponent after send**: Should it show anything, or just "code sent, check your email" and let OtpEnterList handle the rest?

4. **Replacement flow**: If user requests new code to same address, old challenge is killed. Does this need UI indication?

