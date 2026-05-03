# svelteless

A plan for moving OAuth proof entirely into Nuxt, eliminating the SvelteKit workspace.

## How Auth.js is structured

Auth.js factors as a stack of three layers. Each layer is small. Almost all of the actual work happens in the bottom two — the top is framework-shaped ergonomics. Understanding the structure is what tells us where we should be operating.

### `@auth/core` — the engine

A single function: `Auth(request, config) → response`. Hand it a Web `Request`, get back a Web `Response`. That's the entire public API.

Internally, `Auth()` parses the URL pathname (under `config.basePath`, default `/auth`) into one of a fixed set of actions — `signin`, `callback`, `csrf`, `session`, `signout`, `verify-request`, `error`. Each action has a handler in `lib/actions/` that does the work: setting cookies, signing JWTs, validating CSRF, looking up sessions, calling user-supplied callbacks (`signIn`, `redirect`, `session`, `jwt`).

The actual OAuth protocol moves — generate authorize URL, exchange code for token, validate PKCE, fetch userinfo, validate ID tokens — are delegated to `oauth4webapi`, a separate package. `@auth/core` orchestrates around that: state cookies, error handling, callback hooks. JWT signing is delegated to `jose`. Default sign-in and error pages are rendered with `preact` — you only see them if you don't override `pages.signIn` or `pages.error`.

What `@auth/core` knows about: cookies, JWTs, OAuth state, the URL convention. What it doesn't know: HTTP servers, frameworks, routing systems, your application. It's deliberately ignorant of those — that's why it works anywhere you can produce a Web Request.

### Provider modules — one per OAuth provider

In `@auth/core/providers/` there are dozens of these — Google, Twitter, Discord, GitHub, Apple, Auth0, plus many more. Each is a function that returns a config object describing one provider.

For OIDC providers (OpenID Connect, like Google) the module is tiny because OIDC defines a discovery doc — the module just declares `{id, name, type: 'oidc', issuer}` and `@auth/core` fetches the discovery doc at runtime to learn the actual endpoints. Google's whole module (`providers/google.js:108-119`) is twelve lines of code.

For plain OAuth2 providers (like Discord, GitHub) the module supplies the endpoints explicitly: `authorization`, `token`, `userinfo` URLs, plus a `profile()` function that maps the provider's user response to a normalized `{id, name, email, image}` shape. GitHub's module additionally fetches `/user/emails` separately when the user's primary email isn't in the basic profile.

The pattern is consistent: a config object, no runtime code beyond the `profile()` mapper. The actual HTTP traffic happens inside `oauth4webapi`, which `@auth/core` calls during the `signin` and `callback` actions. Provider modules describe *what the provider's endpoints are*, not *how to talk to them*.

### Framework adapters — `@auth/sveltekit`, `@auth/nextjs`, the rest

These are the framework-shaped wrappers. They exist because `@auth/core` only speaks Web Request/Response, and each framework has its own idiom for an HTTP handler — SvelteKit has hooks and `event.request`, Next.js has route handlers and middleware, Express has middleware-style `(req, res)`, Nuxt has h3 events. The adapter's job is to bridge that idiom to `Auth()`.

A framework adapter typically does three things.

First, it exposes a request handler in the framework's idiom that dispatches URLs under `/auth/*` to `Auth()`. For SvelteKit this is the `handle` hook (`@auth/sveltekit/dist/index.js:328-349`) — twenty lines. For Next.js it's a route handler. The shape is identical: read the URL, dispatch on action, call `Auth()`, return the response.

Second, it exposes sign-in and sign-out helpers — `signIn(provider)`, `signOut()` — that perform the POST to `/auth/signin/<provider>` from server-side or client-side framework code, so application code doesn't have to construct the form by hand.

Third, it exposes a session-reading helper that calls `Auth()` internally with `action: 'session'` and unwraps the response into the framework's request context — typically `event.locals.auth()` in SvelteKit, `auth()` in Next.js. This is what an application calls to ask "is the current request signed in, and as whom."

Beyond those three things, an adapter often handles framework-specific environment variable conventions (SvelteKit reads `$env/dynamic/private`, Next.js reads `process.env`), sets up middleware-style protection patterns, and provides framework-specific TypeScript types. Doing all of this well — and tracking the framework's evolution as it changes — is what makes a real adapter a real project. The Auth.js project ships maintained adapters for Next.js, SvelteKit, Express, Qwik, and SolidStart. The Nuxt adapter PR has been languishing because doing it well is a non-trivial commitment no one has signed up to maintain.

There's a fourth thing that's easy to miss: an adapter is also a *configuration machine* that silently rewrites the user's auth options on every request. `@auth/sveltekit/dist/env.js:4-11` exports a `setEnvDefaults` function called inside the handle hook on each request. It sets `config.basePath`, `config.trustHost`, and — critically — `config.skipCSRFCheck = skipCSRFCheck` (the symbol that disables Auth.js's CSRF check entirely). Application code never sees this rewrite happen. Next.js's adapter does similar work in its own `setEnvDefaults`. The choice of which Auth.js defaults to override, leave alone, or expose is part of what makes an adapter opinionated; it's also what makes "use the adapter" different from "use the engine plus the provider module" in ways that aren't visible from the application's config.

### How the layers compose

When an application calls `signIn('google')` through a SvelteKit adapter, this is the actual call path. The adapter's `signIn` helper builds a Web `Request` for POST `/auth/signin/google`. The Request is handed to `Auth()` from `@auth/core`. `Auth()` parses the URL, sees `action: signin, providerId: google`, looks up the Google provider config (from `@auth/core/providers/google`), and dispatches into `lib/actions/signin/`. That action uses `oauth4webapi` to construct Google's authorize URL with PKCE and state, sets cookies for the state and PKCE verifier, and returns a `Response` with a 302 redirect to Google. The adapter writes that Response back to the SvelteKit event. Browser follows the redirect.

The adapter handled the framework-shaped input and output. `@auth/core` ran the state machine. The provider module supplied the URL shape. `oauth4webapi` did the protocol math. Each layer is small because each does one thing.

This factoring is what makes our off-label use viable. Layers one and two do not depend on layer three. We can take `@auth/core` and the provider modules, write a small Nitro endpoint that dispatches to `Auth()`, and we have everything that matters for OAuth proof — without writing or importing a framework adapter at all. We are not building the dormant Nuxt adapter the Auth.js community has been talking about for years; we are doing something much smaller, made possible by the fact that the engine and the providers were designed to work without an adapter in the first place.

The trade-off is that we lose the adapter's silent configuration. The defaults `@auth/sveltekit` was applying transparently — `skipCSRFCheck`, the basePath shape, the cookie-write path that forces `path: "/"` — are now ours to consciously decide. Some we replicate (set `skipCSRFCheck` to match our current security posture, which relies on browser same-origin protection plus our own checks). Some are different by construction (`basePath: '/api/auth'` for our Nuxt routing). Some are irrelevant to us (the cookie-write path is only used by adapter helpers we don't call). Path (c) is a small endpoint plus an explicit configuration that makes those choices visible.

## The Rube Goldberg we have today

OAuth proof currently flows through three places: the Nuxt site at the apex (cold3.cc), a SvelteKit site at `oauth.cold3.cc` running `@auth/sveltekit` against Google, Twitter, Discord, GitHub, and the OAuth providers themselves.

The user clicks "Continue with Google" on the apex site. Nuxt seals an `OauthContinue.` envelope (`site/server/api/oauth.js:14`), and the browser is redirected to `oauth.cold3.cc/continue/google?envelope=...`. SvelteKit opens the envelope to validate the handoff (`oauth/src/routes/continue/[provider]/+page.server.js:9`), then the client page (`+page.svelte:10-17`) builds a hidden form that POSTs to Auth.js's `/auth/signin/google`. Auth runs the OAuth flow with Google, and in our `signIn` callback (`oauth/src/auth.js:60-73`) we seal an `OauthDone.` envelope containing `{success, account, profile, user, browserHash}` and return a redirect URL pointing back to apex `oauth2.vue`. There the envelope is opened, posted to `/credential` as `OauthDone.`, the row is written to the database, and the browser navigates onward.

This works. It is correct. It is also a lot of moving parts:

A whole separate workspace (`oauth/`) with its own scaffold, build, deploy. A separate Cloudflare Worker on a separate subdomain. Two cross-origin redirects per OAuth flow. Two encrypted envelopes per flow (`OauthContinue.` outbound, `OauthDone.` inbound). A `browserHash` mechanism (`oauth/src/auth.js:62-65`) that exists *only* because cookies cannot be read across subdomains — the apex sets a tag cookie at the apex domain so it covers subdomains, SvelteKit reads it on `oauth.cold3.cc`, hashes it before sealing, and the apex re-hashes its own copy on the way back to confirm the user's browser is the same one that started. An entire error trail (`Error3.` envelopes, `error3.vue`, `oauth/src/routes/autherror/+page.server.js`) for getting unexpected SvelteKit-side errors back into the Nuxt error rendering. Provider redirect_uris pointing at `oauth.cold3.cc/auth/callback/<provider>`.

If the OAuth proof flow could happen in the apex Nuxt server itself, all of the above goes away.

## Why we have it (and the path the original analysis missed)

The trail comment in `oauth/src/auth.js:87-149` records the journey: turnkey identity providers (Auth0) carry vendor risk; Passport.js is Express middleware, which doesn't fit our serverless setup; the maintained `next-auth` (now Auth.js) had no Nuxt adapter; an attempt to use `@auth/core` directly in Nuxt didn't work out; SvelteKit had a maintained adapter, so we built a SvelteKit workspace.

The thing the original analysis was missing is the cross-cut. At the time, the choice presented itself as binary: use a maintained framework adapter (path a), or use `@auth/core` directly without provider modules and write each provider's OAuth flow by hand (path b). Path (b) looked like a lot of work and brittle, so we went with (a) — tried `@auth/nuxt` first, found it incomplete and orphaned, and ended up on SvelteKit instead.

What the analysis didn't see was a third path. Use `@auth/core` *together with* its provider modules, without a framework adapter (path c). The provider modules at `@auth/core/providers/*` are just config-returning functions — they don't depend on any framework adapter. `@auth/sveltekit` doesn't enable them; it just imports them and hands them to `Auth()` along with the request. We can do the same thing from a Nitro endpoint. The "framework module" layer gatekeeps ergonomics, not providers. Path (c) was visible in principle from the docs at the time, but without a worked Nitro-shaped recipe, the choice collapsed back to the binary.

The other piece of evidence the original analysis didn't have: we are now operating `@auth/core` in production on Cloudflare Workers, today, through the SvelteKit workspace. The OAuth flow works end to end, every day. So `@auth/core` running on workerd is settled by direct observation, not architectural inference. The remaining question for path (c) is much narrower: does Nitro's Workers preset hand `Auth()` a Web Request the same way SvelteKit's Workers preset does. Both adapters end up calling `Auth(request, config)` with a Web Request derived from their framework's event. If they marshal the request equivalently, path (c) works. That is what the spike confirms.

This document argues, with evidence, that path (c) is the right answer.

## Evidence

Each claim below cites the file we read.

### `@auth/core` has no Node-specific code

The package metadata at `node_modules/.pnpm/@auth+core@0.41.1/node_modules/@auth/core/package.json` lists runtime dependencies: `jose`, `oauth4webapi`, `@panva/hkdf`, `preact`, `preact-render-to-string`. All of these are deliberately written for any JS runtime that has Web Crypto and `fetch`. `nodemailer` and `@simplewebauthn/*` are optional peers, only loaded when email or passkey providers are configured — we don't use those.

A grep for `from 'node:` and `require(` across the entire built tree (`*.js`, `lib/`, `providers/`) returns zero matches. There is no Node-specific import anywhere in `@auth/core`. The package is `"type": "module"`, ESM-only.

### Crypto is Web Crypto via globals

All crypto in `@auth/core` is the global `crypto` object: `crypto.randomUUID()` (`lib/init.js:77` and several callback files), `crypto.subtle.digest("SHA-256", ...)` (`lib/utils/web.js:77`), `crypto.getRandomValues()` (`lib/utils/web.js:87`). These are Web Crypto API calls. Cloudflare workerd exposes all three as globals. SvelteKit on Workers uses the same globals — there is nothing different about Nitro on Workers in this respect.

### `oauth4webapi` is explicitly built for Workers

`oauth4webapi`'s package.json keywords list (`node_modules/.pnpm/oauth4webapi@3.8.5/node_modules/oauth4webapi/package.json`) includes `cloudflare`, `workers`, `workerd`, `edge`, `bun`, `deno`. This is the OAuth state machine library Auth.js uses under the hood for the actual provider dance — generating authorize URLs, exchanging codes for tokens, validating PKCE, fetching userinfo. The author is `panva` (Filip Skokan), who also authors `jose`. Both libraries are reference-quality edge-compatible OAuth/JWT toolkits.

### `Auth()` is the entire API surface

`@auth/core/index.js:66-142` exports a single function: `Auth(request, config)`. It accepts a Web `Request`, returns a Web `Response`. Cookies are read from `request.headers.get('cookie')` (`lib/utils/web.js:33`). Cookies are written via `headers.append('Set-Cookie', ...)` (`lib/utils/web.js:55-62`). The cookie parser is vendored (`lib/vendored/cookie.js`) — no external runtime dep. The dispatch on action and provider lives in `parseActionAndProviderId` (`lib/utils/web.js:91-109`), keyed off the URL path under `config.basePath`.

### Provider modules are pure config

`providers/google.js:108-119` exports a function that returns `{id, name, type, issuer, style, options}`. `providers/twitter.js`, `providers/discord.js`, `providers/github.js` are the same shape with `authorization`, `token`, `userinfo`, `profile` fields filled in. There is no runtime code in a provider module that could fail on Workers. The HTTP calls happen inside `oauth4webapi`, called from `@auth/core`'s callback action.

### The SvelteKit adapter is twenty lines

`@auth/sveltekit/dist/index.js:328-349` — the entire `handle` function:

```js
async handle({ event, resolve }) {
  const _config = typeof config === "object" ? config : await config(event);
  setEnvDefaults(env, _config);
  const action = url.pathname.slice(_config.basePath.length + 1).split("/")[0];
  if (isAuthAction(action) && url.pathname.startsWith(_config.basePath + "/")) {
    return Auth(request, _config);
  }
  return resolve(event);
}
```

Read configuration (lazily if function-shaped), parse the action from the URL, hand the Request to `Auth()`, return the Response. The dispatch logic is twenty lines. The configuration policy is elsewhere — line 112 above calls `setEnvDefaults` from `dist/env.js`, which silently rewrites the config on every request (basePath forced to `/auth`, `skipCSRFCheck` set unconditionally, env-var fallbacks for secret and provider credentials). That part is what the architecture section above calls the adapter's "fourth thing." The `signIn`/`signOut`/`auth` helpers in `dist/actions.js` exist to support optional features (server-side form actions, per-request session lookup) that we don't use.

### Nitro is already wired for Web Request/Response

h3 v1.15.10 (the version Nuxt 4.3 / Nitro 2.13 ships with) provides `toWebRequest(event)` (`dist/index.mjs:339-347`) — converts an h3 event to a standard `Request`. And `sendWebResponse(event, response)` (lines 942-967) — writes a `Response` back to h3, with correct multi-cookie handling via `splitCookiesString` so the multiple cookies Auth.js sets arrive at the browser as multiple `Set-Cookie` headers, not one comma-joined header.

Critically, h3's event handler dispatch detects when a handler returns a `Response` and calls `sendWebResponse` automatically (line 2104). So the Nitro endpoint shape is just `return Auth(toWebRequest(event), config)` — no manual conversion plumbing.

## Anticipated friction points

Several things could trip up the spike. None are structural blockers; each has a recognizable signature and a known fix.

**Secret access path.** SvelteKit on Cloudflare Workers gets per-request env via `event.platform.env`. Nitro on Workers exposes it as `event.context.cloudflare.env` — different property path, same shape. Both also see bundled `.env` values via `process.env`. The icarus `decryptKeys` function takes an array of `{note, environment}` objects, so it doesn't care which property path produced the env — we just hand it both candidates and it merges. This is already how `oauth/src/auth.js:21-26` works on the SvelteKit side; the Nitro version is the same code with one property path swapped.

**Redirect URI math.** Auth.js computes the OAuth redirect URI from the request URL plus `basePath` plus `/callback/<provider>`. With `basePath: '/api/auth'`, the redirect URI becomes `https://cold3.cc/api/auth/callback/google` instead of the current `https://oauth.cold3.cc/auth/callback/google`. We need to update the four provider developer consoles (Google, Twitter, Discord, GitHub) to add the new URI. Provider consoles allow multiple redirect URIs simultaneously, so we can add the new one alongside the old one and run both flows in parallel during migration. There is no flag day.

**CSRF on the form POST — and what the SvelteKit adapter silently does.** `@auth/core/lib/index.js:60-62` calls `validateCSRF` unconditionally on the `signin` action, regardless of provider type. By that reading, our SvelteKit production's empty form POST (`oauth/src/routes/continue/[provider]/+page.svelte:10-17`) should throw `MissingCSRF`. It doesn't — production works every day. The reason is in `@auth/sveltekit/dist/env.js:7`: the adapter's `setEnvDefaults` (called inside `handle` on every request) sets `config.skipCSRFCheck = skipCSRFCheck` unconditionally. `@auth/core/lib/index.js:12` then reads `csrfDisabled = authOptions.skipCSRFCheck === skipCSRFCheck`, and `init.js:102-104` sets `options.csrfTokenVerified = true` directly when `csrfDisabled`. So `validateCSRF` always passes for SvelteKit users, transparent to their config. The implication for path (c): if we use `@auth/core` directly without replicating this default, our empty POST will fail. The fix is one line — `import { skipCSRFCheck } from '@auth/core'` and put `skipCSRFCheck` (the symbol value, used as a config key) into the `Auth()` config. This matches what SvelteKit's adapter does and keeps our security posture identical (we rely on browser same-origin protection plus our own checks, not Auth.js's CSRF mechanism). Alternatively, leave CSRF on and have the trigger fetch a token first; that's stricter but no longer a one-line spike.

**Auth.js exposes endpoints we don't want.** A `[...all].js` catch-all under `/api/auth/` will route every action Auth.js knows about: `signin`, `callback`, `csrf`, `session`, `signout`, `verify-request`, `error`. The first two are what we want. The others are mostly inert — `session` returns `null` because we never write a session, `csrf` returns a token, `signout` clears cookies that aren't there. None of them leak our secrets or our database. But we should narrow the surface anyway: if the action is not `signin` or `callback`, return 404 before calling `Auth()`. Five lines, defense in depth, no behavior change for the user.

**Auth.js's session cookie behavior.** The current config (`oauth/src/auth.js:78-81`) sets `maxAge: 60, updateAge: 0` — Auth.js issues a JWT session cookie that expires in sixty seconds and is never refreshed. We're using Auth purely for proof of account control, not session management. The same config ports unchanged to the Nitro endpoint and is already proven harmless in production.

**`pages.signIn` and `pages.error`.** Currently both point at SvelteKit routes (`/signin`, `/autherror`) that re-seal envelopes back to apex. With everything on apex, we point them at Nuxt routes directly. `pages.error` becomes a Nuxt page (or we let Auth.js's default error redirect lead to a Nuxt route that calls `showError()`). `pages.signIn` is only used when the user clicks Cancel at the provider; same story — a Nuxt page that does whatever we want. The structure simplifies because there is no cross-origin handoff to engineer.

## The spike: simplest thing that produces evidence

Branch or temporary worktree, throwaway. The whole experiment is one new server file plus a browser POST against it. The integration question is whether `@auth/core` and a provider module — Discord, since it's already configured in our developer portal — run cleanly inside a Nitro endpoint on Workers and complete an OAuth round trip back to a callback that fires our `signIn` hook with real provider data.

The new file at `site/server/api/auth/[...all].js` is the catch-all that owns every URL under `/api/auth/` — `/api/auth/signin/discord`, `/api/auth/callback/discord`, the rest. Auth.js routes on the path internally:

```js
//site/server/api/auth/[...all].js
//on the oauth trail: spike — nuxt-only path using @auth/core directly, no sveltekit, no envelope handoff

import {Auth, skipCSRFCheck} from '@auth/core'//skipCSRFCheck is the symbol that, when set in config, tells @auth/core's init to mark csrfTokenVerified=true; @auth/sveltekit/dist/env.js:7 sets this on every request, which is why our SvelteKit production's empty form POST passes validateCSRF
import Discord from '@auth/core/providers/discord'
import {toWebRequest} from 'h3'
import {decryptKeys} from 'icarus'//explicit import: decryptKeys is not in icarusServerPlugin.js's auto-globalize list (it's normally called inside doorWorker, not directly from /server/api files)

export default defineEventHandler(async (event) => {
  let sources = []//collect env sources, same pattern as oauth/src/auth.js with the cloudflare path swapped to nitro's
  if (defined(typeof process) && process.env)        sources.push({note: 'a10', environment: process.env})
  if (event?.context?.cloudflare?.env)               sources.push({note: 'a20', environment: event.context.cloudflare.env})
  await decryptKeys('worker', sources)//'worker' is the namespace site/server uses (see icarus/level2.js:700); whether 'auth' or 'worker' affects which keys are reachable is something the spike will surface

  return Auth(toWebRequest(event), {
    basePath: '/api/auth',
    trustHost: true,
    skipCSRFCheck,//replicates what @auth/sveltekit silently does on every request (env.js:7); without this, the empty form POST fails MissingCSRF
    secret: Key('auth.js, secret'),
    providers: [Discord({
      clientId:     Key('oauth, discord, id'),
      clientSecret: Key('oauth, discord, secret'),
    })],
    callbacks: {
      async signIn({account, profile, user}) {
        log('SPIKE signIn fired', look({account, profile, user}))//this firing with real Discord data is the answer the spike is looking for
        return true//tells Auth.js to redirect to its default callbackUrl; for the spike that's enough
      },
    },
  })
})
```

The icarus utilities `Key`, `log`, `look`, `defined`, `Limit` are auto-globalized in `site/server/` via `site/server/plugins/icarusServerPlugin.js` (alongside `defineEventHandler` from Nuxt). `decryptKeys` is not in that plugin's import list — site/server normally only calls it indirectly via `doorWorker` — so it needs an explicit import in this new file, or you can add it to the plugin's list. Setup: `cd site && pnpm add @auth/core` once before the first build — currently `@auth/core` lives only in `oauth/` as a transitive dep of `@auth/sveltekit`.

To trigger the flow, paste a snippet in the browser DevTools console that submits a hidden empty form to `/api/auth/signin/discord` — the same shape `oauth/src/routes/continue/[provider]/+page.svelte:10-17` uses against SvelteKit today:

```js
const f = document.createElement('form')
f.method = 'POST'; f.action = '/api/auth/signin/discord'
document.body.append(f); f.submit()
```

The empty form POST works because the `skipCSRFCheck` config above replicates what `@auth/sveltekit` does silently on every request. Without that one-line config addition, this POST would fail with `MissingCSRF` and we'd be testing the wrong question — that would be a false negative, not a real architecture failure.

In the Discord developer portal, add `http://localhost:3000/api/auth/callback/discord` (or whatever the dev port is) to the application's redirect URI list, alongside the existing `https://oauth.cold3.cc/auth/callback/discord`. Both stay valid; the existing flow keeps working unchanged.

Total cost: roughly thirty minutes wiring the file plus the `pnpm add`, ten minutes in the Discord developer portal, and however long it takes to click submit and read what happens. The "one day" budget is padding for an unexpected snag; the happy path is short.

## Interpreting the result

**Success looks like.** Click the button. Browser redirects to `discord.com/oauth2/authorize`. Consent screen appears. Click Authorize. Browser redirects back to `localhost:3000/api/auth/callback/discord?code=...`. The Nitro server log shows `signIn fired` with a real `account`, `profile`, and `user` object — provider id, email, name, image. Auth.js then redirects to its default `callbackUrl`. If this round trip completes, the architecture is proven and the path is open.

**Failure modes and what each tells us.**

*`Auth()` throws immediately on the first call,* before any redirect. Probably a runtime feature it expects but the Nitro Workers preset doesn't expose. The thrown error names the feature. Since `@auth/core` is already running on workerd in our SvelteKit workspace today, this would specifically mean Nitro is wrapping the request differently than SvelteKit does — a glue problem, not an Auth.js problem. The error message tells us where to patch the glue.

*Redirect to Discord succeeds but `Auth()` fails after the callback.* Means the token exchange or profile fetch broke inside `oauth4webapi`. Nitro logs name the line. Since `oauth4webapi` is already running this exact flow against Discord in production via SvelteKit, this would point at something Nitro-specific in how the callback request is reaching the handler.

*Discord's redirect to `/api/auth/callback/discord` returns a 404.* The Nitro catch-all isn't routing the way we expect. A path-config issue, not a compatibility issue. Adjust the file name, basePath, or directory layout, retry. Not a blocker.

*Auth.js rejects the POST with `MissingCSRF`.* The `skipCSRFCheck` config we passed didn't take effect. Most likely cause: `skipCSRFCheck` was passed as a string or boolean rather than the symbol value imported from `@auth/core` — `@auth/core/lib/index.js:12` does an identity check (`authOptions.skipCSRFCheck === skipCSRFCheck`), so any value other than the exact imported symbol is rejected. Diagnostic: log the config object before calling `Auth()` and confirm `skipCSRFCheck` is a Symbol. Other possibility: `Auth()` is reading a different config than the one we built (e.g., the lazy-config function returned something different on this call). If both check out, fall back to the proper CSRF flow — `GET /api/auth/csrf` first, include the token as a `csrfToken` field in the form body — three lines added to the trigger.

*Everything works locally but fails on cloud preview.* Means workerd in Cloudflare's actual Workers runtime has stricter limits than the local Nitro Workers simulation. Hardest failure to predict, easiest to read once it happens — Cloudflare's logs name the violation. Worth checking only after local passes.

*signIn fires but with empty or wrong profile fields.* Provider scope or profile-mapping issue. Not a Nitro/Workers compatibility question — an Auth.js config question. Easy to fix.

In every case, the failure narrows the question rather than reopening it. That's what makes this a good spike: success proves the whole path; any specific failure tells us what to fix or what to write off.

## Implementation if the spike confirms

The remaining work is producing the new flow alongside the existing one. Three pieces.

**Port the config to the Nitro endpoint.** Move the contents of `oauth/src/auth.js` — providers list, `secret`, `trustHost`, `session` config — into `site/server/api/auth/[...all].js`. Add the action-narrowing 404 (return early unless action is `signin` or `callback`) before calling `Auth()`. Decide on `pages.signIn` and `pages.error` redirect targets — these are now Nuxt routes on the same origin, simpler than the cross-origin variants they replace. Add the production redirect URI (`https://cold3.cc/api/auth/callback/<provider>`) to each of the four provider consoles alongside the existing URI; both stay valid, so nothing breaks.

**Rewrite the `signIn` callback to write the credential row directly.** This is the actual work. Today, SvelteKit's `signIn` (`oauth/src/auth.js:60-73`) seals an envelope and returns a redirect URL because the database lives in the apex Worker, on the other side of a network boundary. With Auth.js running inside the apex Worker, `signIn` has direct access to the same `door` infrastructure, the credential code, the database. The callback now does what `site/server/api/credential.js` does today for the `OauthDone.` action — writes the credential row, decides where to send the user next, returns the redirect URL. This isn't mechanical; it's a careful merge of two pieces of code that today live on opposite sides of an envelope handoff. The browser-tag check happens here too, but reads the cookie directly from the request rather than going through the `browserHash` round-trip.

**Wire the client.** Replace `OauthPanel.vue`'s `originOauth()` redirect with a hidden form POST to `/api/auth/signin/<provider>`. The component's existing state machine (refClickedProvider, refKey, the bfcache pageshow listener) stays — only the destination URL changes. The store call to `oauthStart` no longer needs to seal an envelope; it can simply gate against tab-races and return.

When these three are done, both flows exist side by side: the old SvelteKit-based path still works for its registered redirect URIs, and the new Nuxt-only path works for the new ones. From there, the cleanup — retiring the SvelteKit workspace, removing the old envelope kinds, deleting `oauth2.vue` and the browserHash mechanism, taking down the `oauth.cold3.cc` subdomain — is yours to do at your own pace.
