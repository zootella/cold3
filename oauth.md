# OAuth: Hardening Plan

The happy path works. Discord smoke test passes. Security is sound. What's next is filing off the rough edges.

## Error Handling Gaps

Six gaps found by auditing the flow files (search "on the oauth trail" to see them).

**1. User cancels at the provider**

When the user clicks "Cancel" on Discord's (or any provider's) auth page, Auth.js catches the cancellation and redirects to `/auth/error` — its own built-in error page, not ours. There's no custom error callback in auth.js to intercept this and send the user back to the Nuxt site gracefully. The SvelteKit app has no `+error.svelte` pages at all.

**2. Refresh on the SvelteKit `/continue/[provider]` page**

The `OauthContinue` envelope has a 2-second lifetime (`Limit.handoffWorker`). First load: envelope valid, page renders, hidden form submits to Auth.js. Refresh after that: envelope expired, `openEnvelope` throws, user silently redirected to apex home with no message explaining what happened.

**3. No `+error.svelte` in the SvelteKit app**

When anything goes wrong on the SvelteKit side, the user either sees Auth.js's default error page or gets silently redirected. No custom error UI exists in the oauth workspace.

**4. `fetchWorker` failure in OauthDemo.vue**

No try/catch around the `clicked()` function. If `fetchWorker('/oauth', 'OauthStart.')` fails or returns without an `envelope` property, the error either bubbles to error.vue (generic "Something went wrong") or navigates to `?envelope=undefined`, which SvelteKit tries to decrypt and fails.

**5. Direct navigation to `oauth2.vue`**

Missing, garbage, or expired envelope all produce the same generic error.vue. No distinction between "you didn't start the flow" vs "your flow expired" vs "corrupted URL." No "please start over" message.

**6. Envelopes are time-limited, not single-use**

`sealEnvelope`/`openEnvelope` in icarus/level2.js use expiration timestamps, not a server-side "already consumed" check. The `OauthDone` envelope can theoretically be replayed within its 2-second window. Narrow, but worth noting. No server-side replay tracking exists.

## Mobile OAuth: What Actually Happens

The concern: on mobile, the user might not be signed into the provider on mobile web, but have the native app installed. Does the OS intercept the OAuth URL and yank the user out of the browser?

**The answer: providers deliberately exclude OAuth paths from deep linking.** The reason is there's no reliable way to get the user back to the right browser tab afterward.

### Per-provider breakdown

**Discord** — AASA file explicitly excludes OAuth URLs that have a `response_type` parameter (which all standard authorization code flows do). Discord engineering explained: "can't reliably send the user back to the right browser." Stays in mobile browser on both iOS and Android.

**Google** — `accounts.google.com` doesn't register Universal Links for its OAuth endpoint at all. Stays in browser everywhere.

**X/Twitter** — AASA excludes `/i/oauth2/*` and `/oauth/*`. On iOS this works. On Android, there's a documented history (2022-2024) of the X app intercepting the URL anyway, flash-opening, then failing. This is the one provider where mobile can break through no fault of ours. Multiple threads in the X developer community confirm the issue with no developer-side workaround.

### The expected mobile UX

The standard UX for "Continue with [Provider]" on mobile web in 2025-2026: tap button, provider auth page loads in the same browser tab, consent/login, redirect back, done. Single tab, no native app, no popup. This is what users expect.

### Cross-subdomain cookie considerations

Our flow is: Nuxt (cold3.cc) → SvelteKit (oauth.cold3.cc) → Provider → SvelteKit → Nuxt. Four hops.

- The browserTag cookie works across subdomains because `cookieOptions.browser` sets `domain: Key('domain, public')` in cloud (icarus/level2.js:378-379) and uses `sameSite: 'Lax'`, which sends on top-level GET navigations from a different site.
- Auth.js state cookies (CSRF, PKCE) default to `SameSite=Lax`, which is correct. `Strict` would break the redirect back from the provider.
- Auth.js production cookies use `__Host-` prefix by default, which cannot have a `Domain` attribute. If we ever need cross-subdomain session sharing from Auth.js cookies (we don't currently — we use envelopes), we'd need to override to `__Secure-` prefix.
- Safari ITP: our 4-hop chain is fine for OAuth (ITP targets third-party iframes, not top-level navigations).

### In-app browsers

If the user starts from inside another app's in-app browser (e.g., clicking a link in the Discord app), that browser has an isolated cookie jar. The flow works, but the user may need to re-authenticate with the provider since their system browser session cookies aren't available. Annoying but not flow-breaking.

### The X/Twitter Android problem in detail

If the X app is installed on Android and the user navigates to `twitter.com/i/oauth2/authorize`, the X app may intercept the URL, flash open briefly, then close without completing authorization. Reported since 2022, reports continued through 2024. No reliable developer-side workaround exists. Sources:
- https://devcommunity.x.com/t/web-oauth-2-0-is-broken-on-android-if-twitter-app-is-installed/169698
- https://devcommunity.x.com/t/android-twitter-app-crashes-if-the-launch-is-triggered-by-a-deep-link-to-https-twitter-com-i-oauth2-authorize/194392

## Next Steps

Three threads to pull on:

1. **Harden the off-happy-path UX** — work through the six gaps above
2. **Connect a second provider** — Google is the safest choice (no Android deep-link weirdness, massive user base). X/Twitter is the most likely to surface mobile-specific bugs, which makes it useful for testing but problematic for users.
3. **Mobile testing** — Discord and Google should just work in mobile browser. X on Android is the wild card. Also test in-app browsers (Discord, Reddit) as referral sources.
