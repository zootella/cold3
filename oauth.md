# OAuth Hardening

## Status

Happy path, sad path (cancel at provider), and Back button all work. Discord smoke test passes on desktop, local and cloud. Security design is sound — envelopes are encrypted, time-limited, and bound to the browser via browserHash. The flow files are breadcrumbed with "on the oauth trail" for navigation.

Mobile: researched and no action needed (see reference section below).

## Sad Path — Cancel at Provider (done)

When the user cancels at the provider, Auth.js redirects to `pages.signIn` with `?error=OAuthCallbackError`. Neither `signIn` nor `redirect` callbacks fire — the error short-circuits before `handleAuthorized()`. Verified against `@auth/core` source.

We use `pages: { signIn: '/signin' }` — Auth.js's documented, stable API for controlling where errors go. The `/signin` route seals an error envelope and redirects to `oauth2.vue`. Same road as the happy path, different on-ramp. OauthDone checks `letter.success` and returns `OauthProven.` or `OauthBad.`.

We rejected intercepting the redirect in SvelteKit's `handle` hook (checking the Location header) because it depends on implementation details that could change in a semver update.

## Back Button — bfcache Restoration (done)

When the user clicks Back from the provider page, the browser restores the Nuxt page from bfcache with all JavaScript state frozen — buttons stuck in the doing/ghost state from when `window.location.href` fired. OauthDemo listens for `pageshow` with `event.persisted` (the browser's signal that the page was thawed, not freshly loaded) and resets `refClickedProvider`. Incrementing a `:key` ref on the wrapping div forces Vue to destroy and recreate the Button components, resetting their internal `refDoing` state.

`pageshow` is a raw browser API with no Vue/Nuxt wrapper — the framework was frozen during bfcache, so it can't intercept its own thawing. `window.addEventListener` inside `onMounted` is the idiomatic Nuxt pattern for client-only browser APIs.

## Other Audit Findings (acceptable as-is)

These were identified in the audit but don't need dedicated solutions:

- **Refresh on SvelteKit `/continue/[provider]`** — 2-second envelope expires, already redirects to home. Acceptable for a page the user is on for 200ms.
- **No `+error.svelte` in SvelteKit** — remaining uncovered case is server crashes, which a custom error page doesn't meaningfully help.
- **`fetchWorker` failure in OauthDemo.vue** — standard fetch error handling. Defer until the real UI replaces the demo component.
- **Direct navigation to `oauth2.vue`** — generic error.vue is fine for this edge case nobody will hit.
- **Envelopes not single-use** — 2-second replay window plus browserHash binding. Theoretical, not practical.

## Future Work

- **Connect a second provider** — Google is the safest choice (no Android deep-link weirdness, massive user base). X/Twitter surfaces mobile bugs but is problematic for users.

## Reference: Mobile OAuth Research

No action needed on our part. Researched Feb 2026.

Providers deliberately exclude OAuth paths from native app deep linking because there's no reliable way to get the user back to the right browser tab afterward. The standard mobile UX is: tap button, provider auth page loads in the same browser tab, consent/login, redirect back. Single tab, no native app, no popup.

**Discord** — AASA file explicitly excludes OAuth URLs with `response_type` parameter. Discord engineering: "can't reliably send the user back to the right browser." Stays in mobile browser on both iOS and Android.

**Google** — `accounts.google.com` doesn't register Universal Links for its OAuth endpoint. Stays in browser everywhere.

**X/Twitter** — AASA excludes `/i/oauth2/*` and `/oauth/*`. Works on iOS. On Android, documented history (2022-2024) of the X app intercepting the URL, flash-opening, then failing. No developer-side workaround. Sources:
- https://devcommunity.x.com/t/web-oauth-2-0-is-broken-on-android-if-twitter-app-is-installed/169698
- https://devcommunity.x.com/t/android-twitter-app-crashes-if-the-launch-is-triggered-by-a-deep-link-to-https-twitter-com-i-oauth2-authorize/194392

**Cross-subdomain cookies** — browserTag cookie works across subdomains because `cookieOptions.browser` sets `domain: Key('domain, public')` in cloud (icarus/level2.js:378) and uses `sameSite: 'Lax'`. Auth.js state cookies default to `SameSite=Lax`, which is correct. Auth.js production cookies use `__Host-` prefix (no `Domain` attribute) — if we ever need cross-subdomain Auth.js session sharing (we don't, we use envelopes), we'd override to `__Secure-` prefix.

**In-app browsers** — isolated cookie jar from the system browser. The flow works but the user may need to re-authenticate with the provider. Not an OAuth-specific problem, just awareness for support.
