# OAuth Hardening

## Status

Happy and sad paths both work end-to-end. Discord smoke test passes on desktop for both authorize and cancel. Security design is sound — envelopes are encrypted, time-limited, and bound to the browser via browserHash. The flow files are breadcrumbed with "on the oauth trail" for navigation.

Mobile: researched and no action needed (see reference section below).

## Sad Path — Single Road Back (done)

### The problem we solved

When the user cancelled at Discord's auth page, the `signIn` callback in auth.js did not fire (it only fires on success). Auth.js redirected to its own default sign-in page at `oauth.cold3.cc/auth/signin?error=OAuthCallbackError`. The user was stranded on a generic Auth.js page with no way back to cold3.cc.

### What Auth.js actually does on cancel (verified against @auth/core source)

When the provider returns `?error=access_denied`, the `oauth4webapi` library's `validateAuthResponse()` throws an `AuthorizationResponseError`. Auth.js catches this in `handleOAuth()`, wraps it in an `OAuthCallbackError` (a subclass of `SignInError`, which has `kind = "signIn"`), and re-throws. The top-level `Auth()` catch block does a raw `Response.redirect()` to `pages.signIn` (NOT `pages.error`) with `?error=OAuthCallbackError`.

Neither `signIn` nor `redirect` callbacks fire. The error short-circuits before `handleAuthorized()` is ever called. There is no `error` event in Auth.js v5 either. The `redirect` callback only fires as a sub-step of `handleAuthorized()`, which requires a successful OAuth exchange.

We considered intercepting the redirect response in SvelteKit's `handle` hook (checking the Location header for `error=OAuthCallbackError`), but this depends on implementation details — the redirect status code, the header format, the error class name — none of which are public API. A semver-compatible Auth.js update could change any of these silently. The cancel flow would break, and we wouldn't catch it immediately since smoke tests cover happy path first.

### The design

Use `pages.signIn` — Auth.js's documented, stable configuration for controlling where errors go. Added a SvelteKit `/signin` route that seals an error envelope and redirects to `oauth2.vue`. Different on-ramp, same road back.

**Happy path**: Provider success → `signIn` callback fires, seals envelope with `{success: true, account, profile, user, browserHash}` → returns `oauth2.vue?envelope=...` → `redirect` passes it through

**Sad path**: Provider cancel → Auth.js redirects to `/signin?error=OAuthCallbackError` → route's server load seals envelope with `{error, browserHash}` → redirects to `oauth2.vue?envelope=...`

Both paths arrive at oauth2.vue with an envelope. oauth2.vue posts to OauthDone either way. OauthDone opens the envelope, checks `letter.success` — returns `OauthProven.` or `OauthBad.` with a route.

### What changed

**`oauth/src/auth.js`** — added `pages: { signIn: '/signin' }` to authOptions. Added `success: true` to the happy-path envelope. Renamed source notes from b-series to a-series (a10, a20, etc.) to match the source location guide.

**`oauth/src/routes/signin/+page.server.js`** (new) — on the oauth trail. Reads `?error=` from Auth.js, seals an error envelope, redirects to `oauth2.vue`. Calls `decryptKeys` itself since it runs outside the `SvelteKitAuth` closure — this is a separate HTTP request from the one that hit the auth handler. Source notes b10, b20.

**`oauth/src/routes/signin/+page.svelte`** (new) — empty component, should never render. Exists because SvelteKit requires `+page.svelte` to render a route; the load function always redirects before rendering.

**`oauth/src/routes/continue/[provider]/+page.svelte`** — migrated from deprecated `$app/stores` to `$app/state` (Svelte 5 runes). `$page.params.provider` → `page.params.provider`.

**`site/server/api/oauth.js`** — OauthDone handler now checks `letter.success` to distinguish happy from sad. Returns `OauthProven.` or `OauthBad.`.

### Back button behavior

Clicking Back at the provider page (instead of Cancel) is a browser-level action — the provider never sends a callback. The user navigates back to the SvelteKit `/continue/[provider]` page, where the envelope has expired (2-second limit), and the catch block redirects home. Not as clean as Cancel, but the user is not stranded.

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
