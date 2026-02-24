
# Credential System

## Direction: unify credentials through one endpoint, one store, one envelope

Right now the credential system is spread across multiple endpoints, stores, cookies, and components — each built at different times for different purposes. `/api/credential` handles Browser, Password, Name, and now TOTP. `/api/otp` handles email/phone verification codes. `/api/totp` is the original standalone TOTP endpoint used by the demos. Each has its own patterns for state management: credentialStore for credentials, pageStore.otps for OTP challenges, direct fetchWorker calls for the TOTP demos. OTP and TOTP each have their own cookie (`temporary_envelope_otp`, `temporary_envelope_totp`) holding their own envelopes with different action labels.

This works, but it's heading toward a world where every new credential type or verification flow brings its own endpoint, store, cookie, envelope format, and POST. A user navigating to their account page would trigger a fan of fetch calls — one per system — each independently loading, each with its own error handling and state management. That's the wrong direction.

The right direction is consolidation. Credentials of many different types should flow through `credentialStore` and `/api/credential`. The endpoint already demonstrates the pattern: `Get.` returns a complete snapshot of every credential type in one response, `attachState` assembles that snapshot, and `apply()` in the store unpacks it into refs. Adding a new credential type means extending attachState and apply — not creating a new endpoint.

**Envelopes should unify too.** Right now OTP and TOTP each seal their own envelope into their own cookie. But imagine a user doing account security housekeeping — enrolling TOTP while also verifying a new email address. That's two overlapping multi-step flows, each needing envelope persistence across page refresh. Rather than multiplying cookies, we should move toward a single `CredentialEnvelope` that can hold in-flight state for multiple credential operations simultaneously. One cookie, one envelope, multiple slots inside it for whatever's in progress.

**`Get.` should absorb `FoundEnvelope.`** The `Get.` action is read-only — it doesn't mutate database state, which is why it's called Get. A page can call it on load, on refresh, on resume, without worrying about side effects. If the client has an envelope cookie, it should just include it with the Get call. The server opens it, attaches the in-flight enrollment or challenge data alongside the regular credential snapshot, and returns everything in one response. No separate FoundEnvelope round-trip. The page makes one call on load and gets back both "here's your current credential state" and "here's where you left off in any in-progress flows." This is how OTP's FoundEnvelope pattern evolves — from a separate action into a natural part of Get.

**Reducing fetch calls is the goal.** A page load should be one GET to the credential endpoint. That one response tells credentialStore everything: which credentials exist, what their display values are, and whether any multi-step flows were interrupted. Components render from the store. When a user takes an action (enroll, remove, verify), that's one POST, and the response includes a fresh attachState snapshot so the store stays in sync. The number of fetch calls should be proportional to the number of user actions, not the number of credential types.

This is the direction we're blowing in. Today's work is TOTP integration — getting it into the credential endpoint and panel. The next steps are envelope unification and Get absorption. The standalone `/api/totp` and `/api/otp` endpoints will eventually become unnecessary as their functionality migrates into `/api/credential`.

## TOTP Credential Integration

### Context

TOTP as a feature is finished and tested — RFC 6238 implementation in level0, credential CRUD in level3, a working server endpoint at `/api/totp`, and two demo components. But it's not yet integrated into the credential system that the app actually uses. The goal is to wire TOTP into the existing credential endpoint, store, and panel so it sits alongside Browser, Name, and Password as a first-class credential — same `Get.` response, same CredentialPanel UI, same CRUD patterns.

### Files modified

- `site/server/api/credential.js` — added TOTP to attachState, added 3 new actions
- `site/app/stores/credentialStore.js` — added TOTP refs, apply fields, 3 new methods
- `site/app/components/credentials/CredentialPanel.vue` — added TotpPanel wiring

### Files created

- `site/app/components/credentials/TotpPanel.vue` — TOTP section panel (enrolled/not-enrolled display, remove, enrollment flow)
- `site/app/components/Reka/Input.vue` — shadcn Input component
- `site/app/components/Reka/Card.vue` and Card sub-components (CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle)

### Files left untouched

- `site/server/api/totp.js` — existing endpoint stays as-is
- `site/app/components/snippet1/TotpDemo.vue` and `TotpDemo1.vue` — demos stay as-is
- `icarus/level0.js`, `icarus/level3.js` — all TOTP functions already exist

---

### 1. credential.js — server endpoint

**Added imports** (these are NOT server-plugin globals, must be explicit):

```js
credentialTotpGet, credentialTotpSet, credentialTotpRemove,
totpEnroll, totpValidate, totpIdentifier,
checkTotpCode,
Data, isExpired,
```

**Extended attachState** to include TOTP status. After the password fetch:

```js
let secret = await credentialTotpGet({userTag: user.userTag})
if (secret) {
    task.totpEnrolled = true
    task.totpIdentifier = await totpIdentifier({secret: Data({base32: secret})})
}
```

When not enrolled, attachState sets `task.totpEnrolled = false` and `task.totpIdentifier = ''`. attachState always returns complete credential information for the userTag — a single call gives the store everything it needs for components to render a complete and correct credential panel.

**Added 3 actions** to the doorWorker actions list: `TotpEnroll1.`, `TotpEnroll2.`, `TotpRemove.`

All three go inside the signed-in-user block (after `credentialBrowserGet` check), alongside SetName/SetPassword/etc.

**TotpEnroll1.** — generates secret, builds otpauth URI, seals secret in envelope with action label `'EnrollTotpEnvelope.'`. Adds `task.enrollment = {uri, envelope, identifier, ...}` on top of the base attachState snapshot. Guards against already-enrolled user.

**TotpEnroll2.** — opens envelope, verifies message matches browser+user+secret, validates TOTP code, calls `credentialTotpSet`. Guards against already-enrolled.

**TotpRemove.** — calls `credentialTotpRemove`.

All three get attachState like every other action.

### 2. credentialStore.js — client store

**Added refs:** `totpEnrolled` (boolean), `totpIdentifier` (string)

**Extended apply:** reads `task.totpEnrolled` and `task.totpIdentifier` from every successful response.

**Added methods:**

- `totpEnroll1()` — calls fetchWorker, calls apply, returns task (enrollment data rides alongside the credential snapshot)
- `totpEnroll2({envelope, code})` — calls fetchWorker, calls apply, returns task
- `totpRemove()` — calls fetchWorker, calls apply

### 3. CredentialPanel.vue — UI

Extended `refEditing` enum to include `'totp'`. Added TotpPanel after the password blocks, only when `credentialStore.userTag` is truthy:

```html
<TotpPanel
    v-if="credentialStore.userTag"
    :editing="refEditing === 'totp'"
    @edit="refEditing = 'totp'"
    @cancel="onCancel"
/>
```

### 4. TotpPanel.vue — new sub-component

Self-contained panel that talks to credentialStore for all data and server calls. Receives editing coordination from parent via props/emits. Wrapped in a Card component for visual grouping.

**Display states:**

- Not enrolled, not editing: `Authenticator App [Add]`
- Not enrolled, editing: QR code on left, instruction text + 6-digit input + Enter/Cancel on right
- Enrolled, not editing: `Authenticator App [X2B] [Edit]`
- Enrolled, editing: `[Remove TOTP] [Cancel]`

**Key details:**

- Uses `useTotpCookie()` to save enrollment envelope across page refresh
- Uses `browserIsBesideAppStore()` for mobile detection (redirect to authenticator app vs QR display)
- Input uses `takeNumerals()` for forgiving code entry — accepts spaces, dashes, letters, extracts digits
- Enter button ghosted until extracted digits reach `totpConstants.codeLength` (6)
- Single-click enrollment: Add link triggers server call, QR appears when data is ready (no intermediate step)

---

### Decisions

**Every successful response includes attachState.** The full credential snapshot is the vanilla scoop; individual actions add their own fields on top. Error returns skip it, which is correct because apply() bails on !task.success. The store is always in sync after any successful call.

**All server calls go through the store.** Even totpEnroll1 which primarily returns enrollment data. Components never import fetchWorker directly.

**Envelope action label `'EnrollTotpEnvelope.'`.** Distinct from the old api/totp.js which uses `'EnrollTotp.'`.

**Props down for UI, store for data.** Credential data flows through the store. The editing mutex flows through props/emits. refEditing lives in CredentialPanel because it's layout state.

---

### Current endpoint and store map

**`/api/credential` + `credentialStore`** — the main credential system. Handles Browser, Password, Name, and now TOTP enrollment/removal. Every successful response includes `attachState` (full credential snapshot). Store exposes refs and methods for all credential types. Used by CredentialPanel and its sub-components (SetPasswordForm, TotpPanel, etc).

Actions: `Get.`, `SignUpAndSignInTurnstile.`, `SignIn.`, `SignOut.`, `SetName.`, `RemoveName.`, `SetPassword.`, `RemovePassword.`, `CheckNameTurnstile.`, `GetPasswordCyclesTurnstile.`, `CloseAccount.`, `TotpEnroll1.`, `TotpEnroll2.`, `TotpRemove.`

**`/api/otp` + `pageStore.otps` + `useOtpCookie()`** — one-time passwords for email/phone verification. Envelope pattern: `FoundEnvelope.` lets the page recover active challenges from a cookie after refresh. Server opens the envelope and returns the non-secret display parts.

Actions: `SendTurnstile.`, `FoundEnvelope.`, `Enter.`

**`/api/totp` (standalone, no store)** — the original TOTP endpoint, used by TotpDemo.vue. Calls go through `fetchWorker` directly, not through any store. Has its own `Status.`, `Enroll1.`, `Enroll2.`, `Validate.`, `Remove.` actions. Uses `useTotpCookie()` for enrollment envelope persistence. TotpDemo has a `FoundEnvelope`-style check on mount (`if (hasText(refCookie.value))`) but the resume path was never implemented (marked `ttd november2025`).

### Note: two cookies, future unification

Right now OTP and TOTP each have their own cookie and envelope: `temporary_envelope_otp` (sealed with action `'Otp.'`) and `temporary_envelope_totp` (sealed with action `'EnrollTotpEnvelope.'`). These exist independently because OTP and TOTP were built at different times. This works but doesn't scale — each new multi-step credential flow shouldn't bring its own cookie.

The future direction is a single `CredentialEnvelope` cookie that can hold in-flight state for multiple credential operations simultaneously — a TOTP enrollment and an OTP verification happening in the same session, stored in one envelope with slots for each. And `Get.` should absorb the FoundEnvelope pattern: if the client has an envelope cookie, include it with Get, and the server opens it and returns any in-progress flow state alongside the regular credential snapshot. One fetch on page load, everything the page needs.

### The gap (current work)

TotpPanel saves the enrollment envelope in `useTotpCookie()` but has no way to recover from it on page refresh. The QR code and identifier are lost with the component state. OTP solved this with `FoundEnvelope.` — the client sends the cookie, the server opens it, returns the display-safe parts. TOTP enrollment needs the same: a `TotpFound.` action in credential.js that opens the enrollment envelope and returns the URI + identifier so the QR code can be shown again without generating a new secret.
