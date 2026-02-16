# OAuth Hardening

## Status

The happy path works end-to-end. Discord smoke test passes on desktop. Security design is sound — envelopes are encrypted, time-limited, and bound to the browser via browserHash. The flow files are breadcrumbed with "on the oauth trail" for navigation.

Mobile: researched and no action needed (see reference section below).

## Next: Sad Path — Single Road Back

The first hardening task is handling the sad path: user clicks cancel at the provider instead of authorizing.

### The problem

Currently, when the user cancels at Discord's auth page, the `signIn` callback in auth.js does NOT fire (it only fires on success). Auth.js redirects to its own default sign-in page at `oauth.cold3.cc/auth/signin?error=OAuthCallbackError`. The user is stranded on a generic Auth.js page with no way back to cold3.cc.

### The design

Funnel all completions — happy and sad — through the same pathway back to Nuxt. The `redirect` callback in Auth.js fires for every redirect Auth.js makes, including error redirects. It runs server-side inside the `SvelteKitAuth(async (event) => {...})` closure, so it has access to `event`, cookies, `sealEnvelope`, everything. No extra SvelteKit route or HTTP round trip needed.

**Happy path** (unchanged): Provider success → `signIn` fires, seals envelope with `{account, profile, user, browserHash}` → returns `oauth2.vue?envelope=...` → `redirect` passes it through unchanged

**Sad path** (new): Provider cancel → `signIn` does NOT fire → Auth.js calls `redirect` with a URL pointing to its own error page → `redirect` detects this, seals envelope with `{error, browserHash}` → returns `oauth2.vue?envelope=...`

Same road. oauth2.vue posts to OauthDone either way. OauthDone opens the envelope, sees proof or error, returns the right route. OauthDone becomes "done with the auth.js flow" not "success."

### Implementation

Two files change. oauth2.vue does not change — it already just posts the envelope and navigates to whatever route the endpoint returns.

**File 1: `oauth/src/auth.js` — expand `redirect` callback (line 70)**

Currently:
```javascript
async redirect({url, baseUrl}) {
	return url
}
```

Change to:
```javascript
async redirect({url, baseUrl}) {
	if (url.startsWith(originApex())) return url //happy path envelope from signIn, pass through

	//sad path: Auth.js is trying to redirect to its own error page; intercept and send back through our road
	let errorCode = new URL(url, baseUrl).searchParams.get('error') || 'unknown'
	let browserTag = parseCookieValue(event.cookies.get(composeCookieName()))
	let browserHash = browserTag ? await hashText(browserTag) : null
	let envelope = await sealEnvelope('OauthDone.', Limit.handoffWorker, {error: errorCode, browserHash})
	return `${originApex()}/oauth2?envelope=${envelope}`
},
```

How to distinguish happy from sad: happy path URLs already contain `originApex()` (signIn composed them). Error URLs point to Auth.js's own pages on the SvelteKit site. `event` is available from the outer closure. All imports are already at the top of auth.js.

**File 2: `site/server/api/oauth.js` — expand OauthDone handler (line 17)**

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
		//sad path: user cancelled or provider returned an error
		log('oauth sad path', look({error: letter.error}))
		return {
			outcome: 'OauthCancelled.',
			route: '/',
		}
	}

	//happy path: user proved they control a third-party account
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
- **No `+error.svelte` in SvelteKit** — the redirect callback now catches error redirects. Remaining uncovered case is server crashes, which a custom error page doesn't meaningfully help.
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
