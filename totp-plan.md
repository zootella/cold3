# TOTP Credential Integration Plan

## Context

TOTP as a feature is finished and tested — RFC 6238 implementation in level0, credential CRUD in level3, a working server endpoint at `/api/totp`, and two demo components. But it's not yet integrated into the credential system that the app actually uses. The goal is to wire TOTP into the existing credential endpoint, store, and panel so it sits alongside Browser, Name, and Password as a first-class credential — same `Get.` response, same CredentialPanel UI, same CRUD patterns.

## Files to modify

- `site/server/api/credential.js` — add TOTP to attachState, add 3 new actions
- `site/app/stores/credentialStore.js` — add TOTP refs, apply fields, 3 new methods
- `site/app/components/credentials/CredentialPanel.vue` — add TOTP section

## New files

- `site/app/components/credentials/TotpPanel.vue` — TOTP section panel (enrolled/not-enrolled display, remove, enrollment flow)

## Files left untouched

- `site/server/api/totp.js` — existing endpoint stays as-is
- `site/app/components/snippet1/TotpDemo.vue` and `TotpDemo1.vue` — demos stay as-is
- `icarus/level0.js`, `icarus/level3.js` — all TOTP functions already exist

---

## 1. credential.js — server endpoint

**Add imports** (these are NOT server-plugin globals, must be explicit):

```js
credentialTotpGet, credentialTotpSet, credentialTotpRemove,
totpEnroll, totpValidate, totpIdentifier,
checkTotpCode,
Data, isExpired,
```
hi claude, ok so make sure you don't import anything explicitly which is automatically and already imported, you can see those blocks by searching "manual icarus imports" several places; don't edit those blocks, but do only import something you need if it's not already here by those blocks

**Extend attachState** to include TOTP status. After the password fetch:

```js
let secret = await credentialTotpGet({userTag: user.userTag})
if (secret) {
    task.totpEnrolled = true
    task.totpIdentifier = await totpIdentifier({secret: Data({base32: secret})})
}
```

When not enrolled, attachState sets `task.totpEnrolled = false` and `task.totpIdentifier = ''`. attachState always returns complete credential information for the userTag — a single call gives the store everything it needs for components to render a complete and correct credential panel.

**Add 3 actions** to the doorWorker actions list: `TotpEnroll1.`, `TotpEnroll2.`, `TotpRemove.`

All three go inside the signed-in-user block (after `credentialBrowserGet` check), alongside SetName/SetPassword/etc.

**TotpEnroll1.** — generates secret, builds otpauth URI, seals secret in envelope with action label `'EnrollTotpEnvelope.'`. Adds `task.enrollment = {uri, envelope, identifier, ...}` on top of the base attachState snapshot. Guards against already-enrolled user. Logic from `api/totp.js` Enroll1 action.

**TotpEnroll2.** — opens envelope, verifies message matches browser+user+secret, validates TOTP code, calls `credentialTotpSet`. Guards against already-enrolled. Logic from `api/totp.js` Enroll2 action.

**TotpRemove.** — calls `credentialTotpRemove`.

All three get attachState like every other action (see principle below).

## 2. credentialStore.js — client store

**Add refs:**

```js
const totpEnrolled = ref(false)
const totpIdentifier = ref('')
```

**Extend apply:**

```js
totpEnrolled.value = task.totpEnrolled || false
totpIdentifier.value = task.totpIdentifier || ''
```

**Add methods:**

- `totpEnroll1()` — calls `fetchWorker('/credential', 'TotpEnroll1.')`, calls apply, returns task (enrollment data rides alongside the credential snapshot)
- `totpEnroll2({envelope, code})` — calls fetchWorker, calls apply, returns task
- `totpRemove()` — calls fetchWorker, calls apply

**Add to return object:** `totpEnrolled`, `totpIdentifier`, `totpEnroll1`, `totpEnroll2`, `totpRemove`

## 3. CredentialPanel.vue — UI

**Extend refEditing enum:** `'' | 'account' | 'name' | 'password' | 'totp'`

**Add TotpPanel** to the template after the password blocks, only when `credentialStore.userTag` is truthy. Props down for editing coordination:

```html
<TotpPanel
    v-if="credentialStore.userTag"
    :editing="refEditing === 'totp'"
    @edit="refEditing = 'totp'"
    @cancel="onCancel"
/>
```

CredentialPanel owns the `refEditing` mutex. TotpPanel emits `edit` when the user clicks Edit/Add, emits `cancel` when done or cancelled. No TOTP-specific handlers needed in CredentialPanel — just the generic wiring above.

## 4. TotpPanel.vue — new sub-component

Self-contained panel that talks to credentialStore for all data and server calls. Receives editing coordination from parent via props/emits.

**Props:** `editing` (boolean) — whether this section is expanded
**Emits:** `edit`, `cancel`

**Reads from store:** `credentialStore.totpEnrolled`, `credentialStore.totpIdentifier`
**Calls on store:** `credentialStore.totpEnroll1()`, `.totpEnroll2()`, `.totpRemove()`

**Display states:**

- Enrolled, not editing: `user has TOTP [X2B] enrolled [Edit]`
- Enrolled, editing: `[Remove TOTP] [Cancel]`
- Not enrolled, not editing: `user has no TOTP [Add TOTP]`
- Not enrolled, editing, step 1: `[Enroll]` button
- Not enrolled, editing, step 2: QR code + 6-digit input + `[Validate Code]` + `[Cancel]`

**Internals:**

- `refStep` ref (1 or 2) tracks enrollment flow progress
- Uses `useTotpCookie()` to survive page refresh between steps
- Uses `browserIsBesideAppStore()` for mobile detection (redirect vs QR)
- Uses existing `<QrCode>` component for QR display
- After successful enroll2 or remove, emits `cancel` to collapse the section

---

## Decision: every successful response includes attachState

Every successful response from `/api/credential` includes the full credential snapshot — attachState is the vanilla scoop, and individual actions add their own fields on top. Error returns (`{success: false, outcome: '...'}`) skip it, which is correct because `apply()` bails on `!task.success`. This means the store is always in sync after any successful call, and no action needs special "refresh state" logic. We may later factor attachState out of each if/else branch (and rename the helper) so it runs once automatically for all successful responses.

## Decision: all server calls go through the store

All fetchWorker calls to `/api/credential` go through credentialStore — even `totpEnroll1` which doesn't mutate store state. This keeps every endpoint communication visible in the single store file, matching the existing pattern (e.g. `checkName` and `getPasswordCycles` also go through the store despite not leaving state). Components never import fetchWorker directly.

TotpPanel calls `credentialStore.totpEnroll1()`, `.totpEnroll2()`, and `.totpRemove()` internally, then emits `cancel` to the parent when done. The parent just needs to set/clear `refEditing`.

## Decision: envelope action label `'EnrollTotpEnvelope.'`

The new credential.js enrollment flow uses `'EnrollTotpEnvelope.'` as the sealEnvelope/openEnvelope action label — distinct from the old `api/totp.js` which uses `'EnrollTotp.'`. Since the old demos will likely be deleted once this is done, overlap isn't a concern.

## Decision: component architecture — props down for UI, store for data

Credential data and server calls flow through the store. UI coordination (the editing mutex) flows through props/emits. `refEditing` lives in CredentialPanel because it's layout state — which section is expanded. TotpPanel receives `:editing` as a prop and emits `edit`/`cancel`. This keeps the store focused on data while Vue handles parent-child UI coordination.

---

## Data flow

**Page load:** Get. → attachState now includes totpEnrolled/totpIdentifier → apply() sets refs → CredentialPanel shows correct section

**Enroll step 1:** TotpEnroll1. → server generates secret, seals envelope → returns enrollment object + full credential snapshot → apply() runs, form reads enrollment data, shows QR

**Enroll step 2:** TotpEnroll2. → server opens envelope, validates code, saves credential → attachState → apply() updates totpEnrolled=true → TotpPanel emits cancel → panel collapses section

**Remove:** TotpRemove. → server removes credential → attachState → apply() updates totpEnrolled=false → panel shows unenrolled state

## Verification

1. Load page signed in — CredentialPanel should show "user has no TOTP [Add TOTP]"
2. Click Add TOTP → Enroll → scan QR with authenticator → enter code → Validate → should show "user has TOTP [X2B] enrolled"
3. Click Edit → Remove TOTP → should return to "user has no TOTP"
4. Sign out and back in — TOTP status should persist correctly
5. Existing TotpDemo and TotpDemo1 still work independently
