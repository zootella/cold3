
# Credential System

## Direction: unify credentials through one endpoint, one store, one envelope

Right now the credential system is spread across multiple endpoints, stores, cookies, and components — each built at different times for different purposes. `/api/credential` handles Browser, Password, Name, and now TOTP. `/api/otp` handles email/phone verification codes. `/api/totp` is the original standalone TOTP endpoint used by the demos. Each has its own patterns for state management: credentialStore for credentials, pageStore.otps for OTP challenges, direct fetchWorker calls for the TOTP demos. OTP and TOTP each have their own cookie (`temporary_envelope_otp`, `temporary_envelope_totp`) holding their own envelopes with different action labels.

This works, but it's heading toward a world where every new credential type or verification flow brings its own endpoint, store, cookie, envelope format, and POST. A user navigating to their account page would trigger a fan of fetch calls — one per system — each independently loading, each with its own error handling and state management. That's the wrong direction.

The right direction is consolidation. Credentials of many different types should flow through `credentialStore` and `/api/credential`. The endpoint already demonstrates the pattern: `Get.` returns a complete snapshot of every credential type in one response, `attachState` assembles that snapshot, and `apply()` in the store unpacks it into refs. Adding a new credential type means extending attachState and apply — not creating a new endpoint.

**Envelopes should unify too.** Right now OTP and TOTP each seal their own envelope into their own cookie. But imagine a user doing account security housekeeping — enrolling TOTP while also verifying a new email address. That's two overlapping multi-step flows, each needing envelope persistence across page refresh. Rather than multiplying cookies, we should move toward a single `CredentialEnvelope` that can hold in-flight state for multiple credential operations simultaneously. One cookie, one envelope, multiple slots inside it for whatever's in progress.

**Reducing fetch calls is the goal.** A page load should be one GET to the credential endpoint. That one response tells credentialStore everything: which credentials exist, what their display values are, and whether any multi-step flows were interrupted. Components render from the store. When a user takes an action (enroll, remove, verify), that's one POST, and the response includes a fresh attachState snapshot so the store stays in sync. The number of fetch calls should be proportional to the number of user actions, not the number of credential types.

This is the direction we're blowing in. The standalone `/api/totp` and `/api/otp` endpoints will eventually become unnecessary as their functionality migrates into `/api/credential`.

## TOTP integration (done)

TOTP is now a first-class credential in `/api/credential` and `credentialStore`, alongside Browser, Password, and Name. Actions: `TotpEnroll1.`, `TotpEnroll2.`, `TotpRemove.`. UI lives in `TotpPanel.vue`, wired into `CredentialPanel.vue`.

`Get.` already absorbs the FoundEnvelope pattern for TOTP: if the client includes an enrollment envelope cookie in the Get body, the server opens it and returns the enrollment data (URI, identifier) alongside the regular credential snapshot. One fetch on page load recovers an in-progress enrollment — no separate round-trip. This is the model for how OTP's `FoundEnvelope.` should eventually work too.

## TOTP mobile enrollment flow (next)

The enrollment UI needs to handle two contexts: desktop (user scans a QR code with their phone) and mobile (the user's phone IS the device — they can't scan their own screen).

`browserIsBesideAppStore()` from icarus wraps the `is-mobile` npm package to detect phones and tablets. The original TotpDemo code used this to automatically redirect via `window.location.href = otpauth://...`, which opens the authenticator app directly. But this has a problem: when the user swipes back to the browser after adding the code in their authenticator, the page is in a broken state. The redirect happened after `emit('edit')` expanded the panel, but the enrollment UI state (refUri, refStep) was never set up because the mobile path skipped that. So the user returns to an expanded but empty section with no code input visible.

The fix: use `browserIsBesideAppStore()` to choose which control to show, but don't auto-redirect. On desktop, show the QR code. On mobile, show a "Load in Authenticator App" button the user taps voluntarily. Both paths land in the same enrollment UI state — step 2 with the code input visible and ready. When a mobile user taps the button and then swipes back from their authenticator, the page is still showing the code input waiting for their 6-digit code.

The enrollment flow becomes the same on both platforms: Add → enrollment UI appears (QR on desktop, button on mobile) with code input → user gets the code into their authenticator one way or the other → enters 6-digit code → done.

## Current endpoint and store map

**`/api/credential` + `credentialStore`** — the main credential system. Handles Browser, Password, Name, and TOTP. Every successful response includes `attachState` (full credential snapshot). Store exposes refs and methods for all credential types. Used by CredentialPanel and its sub-components (SetPasswordForm, TotpPanel, etc).

Actions: `Get.`, `SignUpAndSignInTurnstile.`, `SignIn.`, `SignOut.`, `SetName.`, `RemoveName.`, `SetPassword.`, `RemovePassword.`, `CheckNameTurnstile.`, `GetPasswordCyclesTurnstile.`, `CloseAccount.`, `TotpEnroll1.`, `TotpEnroll2.`, `TotpRemove.`

**`/api/otp` + `pageStore.otps` + `useOtpCookie()`** — one-time passwords for email/phone verification. Envelope pattern: `FoundEnvelope.` lets the page recover active challenges from a cookie after refresh. Server opens the envelope and returns the non-secret display parts.

Actions: `SendTurnstile.`, `FoundEnvelope.`, `Enter.`

**`/api/totp` (standalone, no store)** — the original TOTP endpoint, used by TotpDemo.vue. Calls go through `fetchWorker` directly, not through any store. Has its own `Status.`, `Enroll1.`, `Enroll2.`, `Validate.`, `Remove.` actions. Will eventually be retired as its functionality is now in `/api/credential`.

## Note: two cookies, future unification

Right now OTP and TOTP each have their own cookie and envelope: `temporary_envelope_otp` (sealed with action `'Otp.'`) and `temporary_envelope_totp` (sealed with action `'EnrollTotpEnvelope.'`). These exist independently because OTP and TOTP were built at different times. This works but doesn't scale — each new multi-step credential flow shouldn't bring its own cookie.

The future direction is a single `CredentialEnvelope` cookie that can hold in-flight state for multiple credential operations simultaneously — a TOTP enrollment and an OTP verification happening in the same session, stored in one envelope with slots for each. `Get.` already does this for TOTP; extending it to OTP means OTP's `FoundEnvelope.` action becomes unnecessary.
