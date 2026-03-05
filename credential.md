
# Credential System

## Direction: unify credentials through one endpoint, one store, one envelope

The credential system flows through one endpoint (`/api/credential`), one store (`credentialStore`), and one pattern. `/api/otp` handles email/phone verification codes and will eventually migrate in too.

`Get.` returns a complete snapshot of every credential type in one response, `attachState` assembles that snapshot, and `apply()` in the store unpacks it into refs. Adding a new credential type means extending attachState and apply — not creating a new endpoint.

**Envelopes should unify too.** Right now OTP and TOTP each seal their own envelope into their own cookie. Rather than multiplying cookies, we should move toward a single `CredentialEnvelope` that can hold in-flight state for multiple credential operations simultaneously. One cookie, one envelope, multiple slots inside it for whatever's in progress.

**Reducing fetch calls is the goal.** A page load should be one GET to the credential endpoint. That one response tells credentialStore everything: which credentials exist, what their display values are, and whether any multi-step flows were interrupted. Components render from the store. When a user takes an action (enroll, remove, verify), that's one POST, and the response includes a fresh attachState snapshot so the store stays in sync. The number of fetch calls should be proportional to the number of user actions, not the number of credential types.

`/api/otp` will eventually become unnecessary as its functionality migrates into `/api/credential`.

## TOTP integration (done)

TOTP is now a first-class credential in `/api/credential` and `credentialStore`, alongside Browser, Password, and Name. Actions: `TotpEnroll1.`, `TotpEnroll2.`, `TotpRemove.`. UI lives in `TotpPanel.vue`, wired into `CredentialPanel.vue`.

`Get.` already absorbs the FoundEnvelope pattern for TOTP: if the client includes an enrollment envelope cookie in the Get body, the server opens it and returns the enrollment data (URI, identifier) alongside the regular credential snapshot. One fetch on page load recovers an in-progress enrollment — no separate round-trip. This is the model for how OTP's `FoundEnvelope.` should eventually work too.

## TOTP mobile enrollment flow (done)

The enrollment UI needs to handle two contexts: desktop (user scans a QR code with their phone) and mobile (the user's phone IS the device — they can't scan their own screen).

`browserIsBesideAppStore()` from icarus wraps the `is-mobile` npm package to detect phones and tablets. The original TotpDemo code used this to automatically redirect via `window.location.href = otpauth://...`, which opens the authenticator app directly. But this has a problem: when the user swipes back to the browser after adding the code in their authenticator, the page is in a broken state. The redirect happened after `emit('edit')` expanded the panel, but the enrollment UI state (refUri, refStep) was never set up because the mobile path skipped that. So the user returns to an expanded but empty section with no code input visible.

The fix: use `browserIsBesideAppStore()` to choose which control to show, but don't auto-redirect. On desktop, show the QR code. On mobile, show a "Load in Authenticator App" button the user taps voluntarily. Both paths land in the same enrollment UI state — step 2 with the code input visible and ready. When a mobile user taps the button and then swipes back from their authenticator, the page is still showing the code input waiting for their 6-digit code.

The enrollment flow becomes the same on both platforms: Add → enrollment UI appears (QR on desktop, button on mobile) with code input → user gets the code into their authenticator one way or the other → enters 6-digit code → done.

### Implementation notes (pick up here)

**The bug.** `onEnroll()` lines 72-74 in TotpPanel.vue have a mobile branch that does `emit('edit')` then `window.location.href = uri` without ever setting `refUri` or `refStep = 2`. When the user swipes back from the authenticator, the panel is expanded but the step-2 template guard (`v-else-if="refStep === 2 && refUri"`) doesn't match. Empty card. Mobile browsers often restore from bfcache rather than reloading, so the broken Vue state persists as-is.

**The fix, in four parts.**

**(1) Add a const and a function.** After `const refCookie = useTotpCookie()`, add `const refMobile = browserIsBesideAppStore()`. Add a function `onOpenAuthenticator()` that does `window.location.href = refUri.value`.

**(2) Unify `onEnroll()`.** Remove the `if (browserIsBesideAppStore())` branch entirely. The function should always do: set `refUri.value`, set `refStep.value = 2`, then `emit('edit')`. Same path on both platforms. The mobile-specific behavior moves to the template.

**(3) Template: QR on desktop, button on mobile.** Inside the step-2 template block (`v-else-if="refStep === 2 && refUri"`), use `refMobile` to switch what shows. Desktop: the existing QR + side-by-side layout with instruction text "Scan the QR, then enter the 6 digits you get below." Mobile: a "Load in Authenticator App" button (calls `onOpenAuthenticator`) with instruction text adjusted for tapping instead of scanning. Both show the code input and Enter/Cancel buttons. The `flex gap-4` layout with `shrink-0` QR div is desktop-only; mobile gets a simpler vertical layout.

**(4) bfcache recovery — not needed.** When the user taps the button and swipes back from the authenticator, there are three possibilities: (a) page still warm, (b) bfcache thaw, (c) full reload. Cases (a) and (b) both preserve Vue state — `refStep` is 2, `refUri` is set, the code input is waiting — so there's nothing to recover. Case (c) is already handled by `onMounted`'s cookie recovery via `credentialStore.enrollment` from `Get.`'s envelope pattern. OauthDemo.vue uses a `pageshow` listener for the opposite reason — OAuth needs to *reset* state when the user comes back (they abandoned the flow), whereas TOTP coming back means the flow is *continuing* into already-correct state.

**Smoke test.** Desktop: happy and sad paths still work (nothing changes for desktop flow). Mobile (iPhone Chrome, Galaxy Fold Chrome): tap Add, see the "Load in Authenticator App" button appear (no QR), tap the button, authenticator opens with the code, swipe back, code input still there, enter 6 digits, enrolled.

## Current endpoint and store map

**`/api/credential` + `credentialStore`** — the main credential system. Handles Browser, Password, Name, and TOTP. Every successful response includes `attachState` (full credential snapshot). Store exposes refs and methods for all credential types. Used by CredentialPanel and its sub-components (SetPasswordForm, TotpPanel, etc).

Actions: `Get.`, `SignUpAndSignInTurnstile.`, `SignIn.`, `SignOut.`, `SetName.`, `RemoveName.`, `SetPassword.`, `RemovePassword.`, `CheckNameTurnstile.`, `GetPasswordCyclesTurnstile.`, `CloseAccount.`, `TotpEnroll1.`, `TotpEnroll2.`, `TotpRemove.`, `TotpValidate.`

**`/api/otp` + `pageStore.otps` + `useOtpCookie()`** — one-time passwords for email/phone verification. Envelope pattern: `FoundEnvelope.` lets the page recover active challenges from a cookie after refresh. Server opens the envelope and returns the non-secret display parts.

Actions: `SendTurnstile.`, `FoundEnvelope.`, `Enter.`

## Note: two cookies, future unification

Right now OTP and TOTP each have their own cookie and envelope: `temporary_envelope_otp` (sealed with action `'Otp.'`) and `temporary_envelope_totp` (sealed with action `'EnrollTotpEnvelope.'`). These exist independently because OTP and TOTP were built at different times. This works but doesn't scale — each new multi-step credential flow shouldn't bring its own cookie.

The future direction is a single `CredentialEnvelope` cookie that can hold in-flight state for multiple credential operations simultaneously — a TOTP enrollment and an OTP verification happening in the same session, stored in one envelope with slots for each. `Get.` already does this for TOTP; extending it to OTP means OTP's `FoundEnvelope.` action becomes unnecessary.

## TOTP mobile: split enrollment into two visual stages (done)

On mobile, showing the "Load in Authenticator App" button and the code input + Enter/Cancel all at once is a lot for a small screen. Split the mobile flow into two visual stages: first the button, then (after tapping it) the code input. Desktop is unchanged.

Initially implemented with `refStep` (integer 1/2/3), then refactored to declarative booleans. `refUri` (truthy = enrollment active) and `refOpened` (boolean = mobile user has tapped Load) replaced the integer state machine. Each template element knows when to appear: QR shows when `refUri && !refMobile`, Load button shows when `refUri && refMobile`, code input shows when `refUri && (!refMobile || refOpened)`. No step numbers to mentally map.

Sub-components extracted to `components/totp/`: `TotpText1.vue` (shared instruction text, slot for mid-sentence injection), `TotpText2.vue` (identifier tip, prop-driven with self-guarding v-if), `TotpInput.vue` (numeric code input, defineModel for v-model).

## Unify TOTP endpoint into credential endpoint (done)

`/api/credential.js` now has all TOTP logic: `TotpEnroll1.`, `TotpEnroll2.`, `TotpRemove.`, `TotpValidate.`. The standalone `/api/totp.js` endpoint and its demo components (`TotpDemo.vue`, `TotpDemo1.vue`) have been deleted. The credential endpoint is the single home for TOTP, with full comments, rate limiting, and trail logging. A latent bug in the old totp.js (`totpValidate` called without `Data({base32:})` wrapping) was fixed in the process.
