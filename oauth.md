# OAuth Hardening

## Status

The happy path works end-to-end. Discord smoke test passes on desktop. Security design is sound — envelopes are encrypted, time-limited, and bound to the browser via browserHash. The flow files are breadcrumbed with "on the oauth trail" for navigation.

Mobile: researched and no action needed (see reference section below).

## Next: Sad Path — Single Road Back

The first hardening task is handling the sad path: user clicks cancel at the provider instead of authorizing.

### The problem

Currently, when the user cancels at Discord's auth page, the `signIn` callback in auth.js does NOT fire (it only fires on success). Auth.js redirects to its own default sign-in page at `oauth.cold3.cc/auth/signin?error=OAuthCallbackError`. The user is stranded on a generic Auth.js page with no way back to cold3.cc.

### What Auth.js actually does on cancel (verified against @auth/core source)

When the provider returns `?error=access_denied`, the `oauth4webapi` library's `validateAuthResponse()` throws an `AuthorizationResponseError`. Auth.js catches this in `handleOAuth()`, wraps it in an `OAuthCallbackError` (a subclass of `SignInError`, which has `kind = "signIn"`), and re-throws. The top-level `Auth()` catch block does a raw `Response.redirect()` to `pages.signIn` (NOT `pages.error`) with `?error=OAuthCallbackError`.

Neither `signIn` nor `redirect` callbacks fire. The error short-circuits before `handleAuthorized()` is ever called. There is no `error` event in Auth.js v5 either. The `redirect` callback only fires as a sub-step of `handleAuthorized()`, which requires a successful OAuth exchange.

We considered intercepting the redirect response in SvelteKit's `handle` hook (checking the Location header for `error=OAuthCallbackError`), but this depends on implementation details — the redirect status code, the header format, the error class name — none of which are public API. A semver-compatible Auth.js update could change any of these silently. The cancel flow would break, and we wouldn't catch it immediately since smoke tests cover happy path first.

### The design

Use `pages.signIn` — Auth.js's documented, stable configuration for controlling where errors go. Add a small SvelteKit error-landing route that seals an error envelope and redirects to `oauth2.vue`. Different on-ramp, same road back.

**Happy path** (unchanged): Provider success → `signIn` callback fires, seals envelope with `{account, profile, user, browserHash}` → returns `oauth2.vue?envelope=...` → `redirect` passes it through

**Sad path** (new): Provider cancel → Auth.js redirects to our custom `pages.signIn` route with `?error=OAuthCallbackError` → route's server load seals envelope with `{error, browserHash}` → redirects to `oauth2.vue?envelope=...`

Both paths arrive at oauth2.vue with an envelope. oauth2.vue posts to OauthDone either way. OauthDone opens the envelope, sees proof or error, returns the right route.

### Implementation

Three files change. oauth2.vue does not change — it already just posts the envelope and navigates to whatever route the endpoint returns.

**File 1: `oauth/src/auth.js` — add `pages.signIn` config**

Add to `authOptions`:
```javascript
pages: {
	signIn: '/auth-error',
},
```

This tells Auth.js to redirect cancel/error to our route instead of its default sign-in page. The happy path is unaffected — it never hits `pages.signIn` because the `signIn` callback returns a URL directly.

**File 2: new route `oauth/src/routes/auth-error/+page.server.js`**

```javascript
//on the oauth trail: SvelteKit error landing (user cancelled at provider)

import {
	log, look, Limit,
	Key, decryptKeys,
	sealEnvelope, hashText,
	composeCookieName, parseCookieValue,
	originApex,
} from 'icarus'
import {redirect} from '@sveltejs/kit'

export async function load(event) {
	let sources = []
	if (typeof process !== 'undefined' && process.env) {
		sources.push({note: 'b10', environment: process.env})
	}
	if (event?.platform?.env) {
		sources.push({note: 'b20', environment: event?.platform?.env})
	}
	await decryptKeys('auth-error', sources)

	let errorCode = event.url.searchParams.get('error') || 'unknown'

	let browserTag = parseCookieValue(event.cookies.get(composeCookieName()))
	let browserHash = browserTag ? await hashText(browserTag) : null

	let envelope = await sealEnvelope('OauthDone.', Limit.handoffWorker, {error: errorCode, browserHash})
	log('oauth sad path, sealing error envelope', look({errorCode}))

	throw redirect(303, `${originApex()}/oauth2?envelope=${envelope}`)
}
```

This route only fires on the sad path. It calls `decryptKeys` itself since it runs outside the `SvelteKitAuth` closure (same sources pattern as auth.js). No `+page.svelte` needed — the load function always redirects, never renders.

**File 3: `site/server/api/oauth.js` — expand OauthDone handler**

Currently:
```javascript
} else if (action == 'OauthDone.') {
	let letter = await openEnvelope('OauthDone.', body.envelope, {browserHash})
	log('letter arrived in worker 📩 now in oauth.js OauthDone!!', look(letter))
	return {
		outcome: 'OauthProven.',
		route: '/',
	}
}
```

Change to:
```javascript
} else if (action == 'OauthDone.') {
	let letter = await openEnvelope('OauthDone.', body.envelope, {browserHash})
	log('letter arrived in worker 📩 now in oauth.js OauthDone!!', look(letter))

	if (letter.error) {
		log('oauth sad path', look({error: letter.error}))
		return {
			outcome: 'OauthCancelled.',
			route: '/',
		}
	}

	return {
		outcome: 'OauthProven.',
		route: '/',
	}
}
```

browserHash check in `openEnvelope` runs for both paths. On the sad path, if the browserTag cookie was missing mid-flow, the envelope's browserHash will be null. If the worker's browserHash is present but the envelope's is null, `openEnvelope` catches the mismatch — correct, we don't accept envelopes from a different browser. If both are null (cookie gone on both sides), the check is skipped — acceptable for the sad path since we're not granting permissions, just showing "try again."

### Test plan

1. Click "Continue with Discord" → on Discord's auth page click Cancel → should come back to cold3.cc home, not Auth.js error page
2. Confirm happy path still works (click Authorize at Discord → comes back with proof)
3. Check logs for both paths to see what `errorCode` Auth.js actually passes

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
