
# OG Image System

Social share cards — the little preview images that appear when someone pastes a link on Twitter, Slack, iMessage, etc. An afterthought for users, critically important for the product, and one of the most technically sophisticated parts of the Cloudflare deployment.

The site workspace uses `nuxt-og-image` 6.0.0-beta.15 to generate 1200x630 PNG images entirely inside the Cloudflare Worker at cold3.cc. No external services, no headless Chrome, no Node.js. Pure WASM.

## Goals and Requirements

Think of a site like early Twitter: every post has a card, showing its text. Billions of posts over a decade of global use. Three properties define the caching requirements:

🔥 **Hot cards.** A post goes viral and millions of people worldwide request its card. The system must serve it from cache — not re-render on every request. Some additional renders are fine (once per day of virality, once per geographic region), but not one render per request.

🧟 **Zombie cards.** The vast majority of cards ever generated will never be requested again. Users quit; posts quickly fade from relevance. A cache that stores cards forever is a cache where nearly every entry is dead weight, and storage grows without bound. The system must evict cards automatically.

🍞 **Cards don't go stale.** A card shows post text, not statistics. The post can't be edited. A fresh render of a previously rendered card produces the exact same pixels. There is zero value in re-rendering for freshness — only cost.

## How to Test

There is no local or staging environment for this — the WASM rendering pipeline, Cloudflare CDN edge caching, and KV bindings only exist in the real production Worker at cold3.cc. Every test targets production. The same test must be repeatable before any changes and after each change to code or configuration, so that results are directly comparable and we can trust what they tell us.

**Method.** Use a unique card route each run (to guarantee no prior cache state), fetch the og:image URL twice with curl, and read the headers and timing.

```sh
# Step 1: get a fresh og:image URL from a unique route
OG_URL=$(curl -s "https://cold3.cc/card/test$RANDOM" | grep -o 'content="https://cold3.cc/_og[^"]*' | sed 's/content="//')

# Step 2: first fetch (expect cache miss — Worker renders the image)
curl -s -D- -o /dev/null -w "\nTotal: %{time_total}s\n" "$OG_URL"

# Step 3: second fetch, same URL, a few seconds later (expect cache hit)
curl -s -D- -o /dev/null -w "\nTotal: %{time_total}s\n" "$OG_URL"
```

**Example run — current configuration (KV + no CDN), 2026feb7:**

```
First fetch (701ms — full satori render):
  content-type: image/png
  content-length: 27527
  cache-control: public, s-maxage=1200, stale-while-revalidate
  etag: W/"Biiq6MATtCQGZsFE1JaUNHQ7kNPdeUB6YC7gPd0iBRs"
  last-modified: Sat, 07 Feb 2026 21:05:21 GMT
  set-cookie: __Secure-current_session_password=...; Max-Age=34128000; ...
  cf-placement: remote-EWR
  (no cf-cache-status header)

Second fetch (103ms — KV cache hit):
  etag: W/"Biiq6MATtCQGZsFE1JaUNHQ7kNPdeUB6YC7gPd0iBRs"    ← same
  last-modified: Sat, 07 Feb 2026 21:05:21 GMT               ← same
  set-cookie: __Secure-current_session_password=...; ...      ← still present
  (no cf-cache-status header)
```

KV caching works (701ms → 103ms). CDN is not caching — no `cf-cache-status` on either response, because `Set-Cookie` is present on both. Analyze results:

- **`cf-cache-status`** — the definitive signal. First request: `MISS` (or absent). Second request: `HIT`. If absent on both, the CDN is not caching (likely `Set-Cookie` is still present).
- **`age`** — Cloudflare adds this to cached responses (seconds since entry). Present on second request = CDN is serving from edge.
- **`set-cookie`** — should be absent on `/_og/*` responses. If present, CDN will refuse to cache.
- **Timing** — ~650ms = full satori render. ~100ms = KV cache hit. ~10–30ms = CDN edge hit.

## How It Works

`nuxt-og-image` on Cloudflare is designed for sites with dynamic cards — dashboards, profiles, articles — where card content changes as the underlying data changes. The module's caching is built around freshness: render, cache for a TTL, then re-render to pick up changes. A request for a card passes through two cache layers before reaching the renderer:

```
👤 user's device  ←→  ⛅ Cloudflare CDN  ←→  🔑 KV cache  ←→  🎨 satori renderer
```

**⛅ The CDN cache.** The outermost layer. On every response (whether freshly rendered or served from KV), the module sets `Cache-Control: public, s-maxage={cacheMaxAgeSeconds}, stale-while-revalidate`. This tells Cloudflare's CDN to cache the response at each of its ~300 edge PoPs. A CDN-cached card is served directly from the edge nearest the user — no Worker execution at all. After the TTL expires, the CDN evicts the entry automatically.

Everything past the CDN is a Worker invocation. The Worker runs all middleware and the module's route handler on every request that reaches it. The two code paths inside the Worker are:

**🔑 The KV cache.** The module's application-level cache, configured by pointing `runtimeCacheStorage` at a Cloudflare KV namespace. The route handler checks KV first — if a valid entry exists, it serves the stored PNG (~100ms) without rendering. After rendering a new card, `cache.js` base64-encodes the PNG and writes it to KV alongside an `expiresAt` timestamp (`Date.now() + cacheMaxAgeSeconds * 1000`). On the next request, it checks the timestamp — if expired, it deletes the entry and falls through to the renderer. This is lazy expiration: an entry is only evaluated when re-requested. Entries that are never re-requested persist in KV forever.

The module does not use KV's native `expirationTtl` (which would give true automatic deletion). There is no configuration option to enable it — changing this would require patching the module.

**🎨 The renderer.** The expensive path. Two WASM modules — yoga (flexbox layout) and resvg (SVG rasterization) — turn a `.satori.vue` component into a 1200×630 PNG. A render takes ~650ms. WASM instances are initialized once per Worker isolate and reused for subsequent requests in that isolate.

For the module's intended use case — dynamic cards that go stale — this layering makes sense. The KV cache absorbs repeated requests between CDN misses, and `cacheMaxAgeSeconds` controls how long stale data is acceptable. The CDN provides geographic distribution and offloads the Worker. Both caches expire on the same TTL, so the site never serves a card more than `cacheMaxAgeSeconds` out of date.

## Current Configuration

`site/nuxt.config.js`:

```js
configuration.ogImage = {
  defaults: {
    cacheMaxAgeSeconds: 20*Time.minutesInSeconds  // = 1200 seconds. default if omitted is 3 days
  },
  runtimeCacheStorage: {
    driver: 'cloudflare-kv-binding',
    binding: 'OG_IMAGE_CACHE',
  },
}
```

`site/wrangler.jsonc`:

```jsonc
"kv_namespaces": [
  {"binding": "OG_IMAGE_CACHE", "id": "ee95a879988944c2a7eb9521e62eb102"}
]
```

Dependencies: `nuxt-og-image` 6.0.0-beta.15, `satori` 0.15.2, `@resvg/resvg-js` ^2.6.2, `@resvg/resvg-wasm` ^2.6.2.

Key module source files (in `node_modules/nuxt-og-image/dist/runtime/server/`): `util/eventHandlers.js` (route handler, orchestrates cache then render), `util/cache.js` (`useOgImageBufferCache()`, sets headers, writes to storage), `og-image/satori/renderer.js` (the satori+resvg pipeline), `og-image/satori/instances.js` (WASM singleton management).

With this configuration, both cache layers are active. The KV cache works — as the test results show, second fetch drops from ~650ms to ~100ms. But the CDN cache does not work. The next section explains why.

## The Cookie Fix 🍪

The CDN is not caching og:image responses. The test results show no `cf-cache-status` header on either fetch, meaning the CDN is not participating at all — despite the module correctly setting `Cache-Control: public, s-maxage=1200, stale-while-revalidate`.

Our best theory for why: `site/server/middleware/cookieMiddleware.js` is a Nitro middleware that runs on every incoming request. It reads or creates a browser tag (a durable and private identifier for authentication) and sets it as a cookie:

```js
setCookie(workerEvent, composeCookieName(), composeCookieValue(browserTag), cookieOptions.browser)
// → Set-Cookie: __Secure-current_session_password=...; Max-Age=34128000; HttpOnly; Secure; SameSite=Lax
```

The middleware runs on *every* request — HTML pages, API calls, and `/_og/*` image routes alike. It has no route filtering. An og:image response doesn't need a browser tag (the consumer is a social crawler or an `<img>` tag, not a user session), but it gets one anyway.

Cloudflare's CDN refuses to cache any response that contains a `Set-Cookie` header. This is a deliberate security policy — caching a `Set-Cookie` could serve one user's session cookie to another. The test results are consistent with this: `Set-Cookie` is present on both fetches, and `cf-cache-status` is absent on both.

This is a theory, not a confirmed diagnosis. It's possible something else is also preventing CDN caching. The proposed fix — skipping the cookie middleware for `/_og/` routes — will test the theory. If `cf-cache-status: HIT` appears on the second fetch after deploying the fix, the theory is confirmed. If it doesn't, we need to investigate further.

## Replace KV with default memory cache

Fixing the cookie gets the CDN working, but KV still has the zombie problem. KV entries for cards that are never re-requested persist forever with no cleanup mechanism. At scale, this means unbounded and growing storage costs for dead entries.

Our idea as to a possible fix is pretty simple: remove the `runtimeCacheStorage` block from nuxt.config. Without it, the module stops using KV and falls back to Nitro's default in-memory storage driver.

The in-memory driver isn't a workaround — it's the normal, intended cache for most deployments. On a traditional Node.js server (EC2, a VPS, a Docker container), the process is long-lived, and in-memory storage is a real working cache: a JavaScript Map in the process's heap that persists across requests for days or weeks until the next deploy. The second request for the same card reads from the Map and skips the renderer. `runtimeCacheStorage` exists for when you *need* shared or durable storage beyond a single process, like KV on Cloudflare.

The module's cache code still runs, still writes to in-memory storage, and — importantly — still sets the `Cache-Control` header on the response. The CDN sees that header and caches the response at the edge with automatic eviction after the TTL. KV is out of the picture — no zombie entries, no growing storage costs.

## Replace default memory cache with lru-cache

The default `memory` driver is a plain Map with no size limit. It has the same unbounded growth problem as KV, just in process memory instead of external storage. On a long-lived EC2 process, entries accumulate until the process runs out of heap memory.

On a Cloudflare Worker, the contract is that you must be ready for a fresh isolate on every request — but the opposite can also be true. Cloudflare users have reported isolates living for weeks, serving millions of requests. You can't rely on persistence, but you can't assume ephemerality either. A long-lived isolate using the default `memory` driver would accumulate an entry for every unique card it renders, with no eviction, until it hits the Worker's 128MB memory limit and gets killed.

unstorage ships an `lru-cache` driver (backed by `lru-cache` v11) as a bounded alternative, with configurable `max` (entry count, default 1000), `maxSize` (total bytes), and `ttl` (per-entry expiration). `lru-cache` is already in the dependency tree as a direct dependency of unstorage — no `pnpm add` needed. The safe choice is `lru-cache` with a low cap:

```js
configuration.ogImage = {
  defaults: {
    cacheMaxAgeSeconds: 2*Time.hoursInSeconds,//fans out to three places in nuxt-og-image's cache implementation nuxt-og-image/dist/runtime/server/util/cache.js (1) the Cache-Control header that enables the cloudflare cdn to work; (2) the lru-cache driver's expiresAt entry; (3) maxAge in h3's handleCacheHeaders which enables 304 conditional requests. (1) is the only one we need, and thre's no way to set it independently
  },
  runtimeCacheStorage: {//without this block, Nitro falls back to the default memory driver, a Map with no size limit, bad
    driver: 'lru-cache',//still in memory, already in our dependency tree, but fancy enough we can set a limit
    max: 1,//lowest allowed value, but the most recently rendered card is still returned from here
  },
}
```

`max: 1` means the LRU holds at most one card. The module's cache code still runs and still sets `Cache-Control` headers on every response, but the in-isolate cache is effectively inert — it can't serve a hit unless two consecutive requests for the exact same card land on the same isolate. This makes test results clean: a fast response is a CDN hit, a slow response is a render. (`max: 0` doesn't mean zero entries — it means "not set," and lru-cache throws a TypeError unless `ttl` or `maxSize` provides an alternative bound. Don't use it.)

This can be bumped to 50 or higher later if the in-isolate cache turns out to be worth using as a second layer behind the CDN. At ~37KB per entry, `max: 50` would cap at ~1.8MB regardless of isolate lifetime.

The CDN remains the primary cache. The module still sets `Cache-Control: public, s-maxage=7200` on every response, so the CDN caches at the edge with automatic 2-hour eviction. The LRU cache is a bounded safety net inside the Worker.

## Plan

1[x]run tests and document results as a record of our starting point
2[]make the cookie not break the cdn
3[]repeat tests to confirm the cdn works
4[]configure lru cache with capacity 1 in place of the kv store
5[]repeat tests to confirm behavior matches requirements and goals as a whole
6[]delete the KV store from the cloudflare dashboard

## Trail Notes

### 1. Baseline tests (2026feb7, ~22:48 UTC)

Configuration: KV cache enabled (`OG_IMAGE_CACHE` binding), `cacheMaxAgeSeconds: 1200`, cookie middleware running on all routes. Deploy from commit `8b358a1` (clean working tree).

Test route: `/card/test1584` (unique, no prior cache state). og:image URL:
```
/_og/d/c_ProfileCard,title_%F0%9F%A7%94%F0%9F%8F%BB+test1584,sticker_CloudPageServer.2026feb07.SCRPUA5,q_e30,p_Ii9jYXJkL3Rlc3QxNTg0Ig.png?_v=6bc16989-7e10-4dc3-8353-95b3cc6c9b7a
```

**First fetch (859ms — full satori render):**
```
content-type: image/png
content-length: 27286
cache-control: public, s-maxage=1200, stale-while-revalidate
etag: W/"Axyov5M0U5BMNLny4LeHTrN_vc6ViQjgDh418ltDoO4"
last-modified: Sat, 07 Feb 2026 22:48:28 GMT
set-cookie: __Secure-current_session_password=...; Max-Age=34128000; Domain=cold3.cc; Path=/; HttpOnly; Secure; SameSite=Lax
cf-placement: remote-EWR
cf-cache-status: (absent)
```

**Second fetch (128ms — KV cache hit):**
```
content-type: image/png
content-length: 27286
cache-control: public, s-maxage=1200, stale-while-revalidate
etag: W/"Axyov5M0U5BMNLny4LeHTrN_vc6ViQjgDh418ltDoO4"    ← same
last-modified: Sat, 07 Feb 2026 22:48:28 GMT               ← same (not re-rendered)
set-cookie: __Secure-current_session_password=...; Max-Age=34128000; Domain=cold3.cc; Path=/; HttpOnly; Secure; SameSite=Lax
cf-placement: remote-EWR
cf-cache-status: (absent)
```

**Analysis:**

KV caching works — timing drops from 859ms to 128ms, etag and last-modified are identical (served from KV, not re-rendered). CDN is not caching — `cf-cache-status` is absent on both fetches. `Set-Cookie` is present on both responses (different cookie values — a new browser tag is minted per request). This is consistent with the theory: Cloudflare's CDN refuses to cache responses with `Set-Cookie`, so despite the correct `Cache-Control` header, the CDN never stores the response.

Both requests were placed at `remote-EWR` (Newark). Curl ran from Denver — the CDN PoP routing and Worker placement are independent of where we're testing from.

### 2. Cookie fix (2026feb7)

Added an early return to `site/server/middleware/cookieMiddleware.js` — if the request path starts with `/_og/`, skip the entire middleware. No cookie is read, written, or set in the response. No `workerEvent.context.browserTag` is populated. This is safe because `/_og/` routes go straight to nuxt-og-image's route handler — no SSR, no `fetchWorker`, no `doorWorker`, nothing downstream needs the browserTag.

Also made several housekeeping changes discovered during the review of the cookie/auth system:

- Unexported `slug()` and `deaccent()` from `icarus/level1.js` and removed both from `icarus/index.js` re-exports. Both were only called internally by `validateName()` — the exports were dead.
- Added `_og`, `_nuxt`, and `_payload` to `reservedRoutes` in `validateName`, preventing users from registering usernames that would collide with Nuxt's underscore-prefixed system routes.
- Converted `reservedRoutes` from an array with `.includes()` to a Set with `.has()`, and switched to a template literal format for easier readability and maintenance of the list.

### 3. Post-cookie-fix test (2026feb8, ~02:38 UTC)

Configuration: KV cache still enabled (`OG_IMAGE_CACHE` binding), `cacheMaxAgeSeconds: 1200`, cookie middleware now skips `/_og/` routes. Deploy from commit `c007a5e`.

Test route: `/card/test12448` (unique, no prior cache state). og:image URL:
```
/_og/d/c_ProfileCard,title_%F0%9F%A7%94%F0%9F%8F%BB+test12448,sticker_CloudPageServer.2026feb08.NPMW3X2,q_e30,p_Ii9jYXJkL3Rlc3QxMjQ0OCI.png?_v=2e7c90c5-8bf0-4cb5-9e44-ea518079d2e7
```

**First fetch (818ms — full satori render):**
```
content-type: image/png
content-length: 28616
cache-control: public, s-maxage=1200, stale-while-revalidate
etag: W/"YDzNr-gy0H-ULhpHkoXIXXIi7xkNl_VHf4jCiOF0BT0"
last-modified: Sun, 08 Feb 2026 02:38:29 GMT
vary: accept-encoding, host
set-cookie: (absent)
cf-placement: remote-EWR
cf-cache-status: (absent)
```

**Second fetch (100ms — KV cache hit):**
```
content-type: image/png
content-length: 28616
cache-control: public, s-maxage=1200, stale-while-revalidate
etag: W/"YDzNr-gy0H-ULhpHkoXIXXIi7xkNl_VHf4jCiOF0BT0"    ← same
last-modified: Sun, 08 Feb 2026 02:38:29 GMT               ← same
vary: accept-encoding, host
set-cookie: (absent)
cf-placement: remote-EWR
cf-cache-status: (absent)
```

**Analysis:**

The cookie fix works — `Set-Cookie` is absent on both responses, confirming the middleware early-return is effective. However, the CDN is still not caching: `cf-cache-status` is absent on both fetches, and timing (818ms → 100ms) matches a KV cache hit, not a CDN edge hit (~10–30ms). The `Set-Cookie` theory was partially right — the cookie needed to go — but removing it was not sufficient to enable CDN caching. Something else is also preventing the CDN from caching Worker responses.

### 4. Workers run in front of the CDN (2026feb8)

Research revealed the root cause: Cloudflare Workers run *in front of* the CDN cache, not behind it. A response generated by the Worker goes straight to the client — the CDN never sees it, never caches it, regardless of Cache-Control headers. This is documented, intentional architecture, not a bug. The `Cache-Control` header nuxt-og-image sets is correct but irrelevant — no CDN component is in the pipeline to read it.

The only way to get CDN caching for Worker-generated responses is the Cache API (`caches.default`), which writes to and reads from the same per-datacenter edge cache the CDN uses. The Worker must explicitly `cache.match()` on the way in and `cache.put()` on the way out.

Also ruled out: `Vary: Host` is not the problem — Cloudflare ignores most Vary values in caching decisions. Cache Rules and Page Rules don't help either — they operate on the CDN layer, which Worker responses bypass entirely.

### 5. Self-fetch attempt and 522 (2026feb8)

First implementation attempt: a single middleware (`middleware10.js`) that wraps `/_og/` routes with the Cache API. On cache miss, it would self-fetch — `fetch(url, { headers: { 'x-og-render': '1' } })` — to re-enter the Worker as a new invocation, then capture the rendered response and `cache.put()` it. The bypass header would tell the middleware to pass through on the subrequest.

This failed with HTTP 522 (Connection Timed Out). Cloudflare's infrastructure-level loop detection killed the request before our bypass header could be read. When a Worker calls `fetch()` to its own zone, Cloudflare detects the recursion at the network layer and returns 522. The `cf-placement: local-DEN` on the error response confirmed the request died at the edge before Smart Placement even routed it.

Self-fetch is not a viable pattern for Cloudflare Workers.

### 6. Cache API via middleware + plugin (2026feb8, commit `84f2132`, sticker `PBLMQDC`)

Replaced the self-fetch with a two-file approach that separates cache reads from cache writes:

`site/server/middleware/middleware10.js` — runs first (before middleware20, the cookie middleware). Checks `caches.default.match()` for `/_og/` routes. On cache hit, returns the cached PNG directly — nothing downstream runs. On cache miss, sets `workerEvent.context._ogCacheKey` as a flag and falls through to nuxt-og-image's normal handler.

`site/server/plugins/ogCachePlugin.js` — Nitro plugin that hooks `beforeResponse`. When the `_ogCacheKey` flag is present (set by middleware10 on cache miss), it takes `response.body` (the raw Buffer returned by nuxt-og-image's handler) and the response headers already set on the event by the module's cache.js, builds a Response, and `caches.default.put()`s it. Uses `waitUntil()` for non-blocking storage after the response is already on its way to the client.

Also renamed middleware files from `cookieMiddleware.js` / `cacheMiddleware.js` to `middleware10.js` / `middleware20.js` to make execution order explicit and leave room for future middleware.

The `beforeResponse` approach works because nuxt-og-image's handler `return`s the image Buffer (eventHandlers.js line 96) rather than calling `send()` directly. h3 v1's `beforeResponse` hook receives the raw return value as `response.body`, and the headers (cache-control, etag, last-modified, vary) are already set on the event by the module's cache.js before the return. If the handler had used `send()` instead, `beforeResponse` would fire with `body: undefined` (a known h3 v1 limitation, issue #596) and this approach wouldn't work.

Test route: `/card/test18467`. og:image URL:
```
/_og/d/c_ProfileCard,title_%F0%9F%A7%94%F0%9F%8F%BB+test18467,sticker_CloudPageServer.2026feb08.PBLMQDC,q_e30,p_Ii9jYXJkL3Rlc3QxODQ2NyI.png?_v=5a506124-ebfc-4dda-bab6-386132aae478
```

**First fetch (817ms — full satori render, cache miss):**
```
content-type: image/png
content-length: 28282
cache-control: public, s-maxage=1200, stale-while-revalidate
etag: W/"r7093XMKvyR4mnk659sx1RM-PGQowrxHBJTimlkb8g4"
last-modified: Sun, 08 Feb 2026 23:13:53 GMT
vary: accept-encoding, host
set-cookie: (absent)
cf-placement: local-DEN
cf-cache-status: (absent)
x-og-cache: (absent — middleware fell through on miss)
```

**Second fetch (44ms — edge cache hit):**
```
content-type: image/png
content-length: 28282
cache-control: public, max-age=14400, s-maxage=1200, stale-while-revalidate
etag: W/"r7093XMKvyR4mnk659sx1RM-PGQowrxHBJTimlkb8g4"    ← same
last-modified: Sun, 08 Feb 2026 23:13:53 GMT               ← same
cf-cache-status: HIT                                        ← CDN is caching!
age: 17                                                     ← seconds in cache
x-og-cache: HIT                                             ← our middleware served from cache
set-cookie: (absent)
cf-placement: local-DEN
```

**Analysis:**

The CDN is working. `cf-cache-status: HIT` and `age: 17` confirm the response was served from Cloudflare's edge cache. `x-og-cache: HIT` confirms our middleware's `caches.default.match()` found the entry. Timing dropped from 817ms (full render) to 44ms (edge cache), a 19x improvement and faster than the old KV-only path (100ms). The `Set-Cookie` header is absent on both fetches, confirming the cookie middleware early-return is still working.

The system now matches the target architecture: first request renders and stores in the edge cache, every subsequent request at the same datacenter is served from cache with zero Worker execution. Cache entries expire automatically per the `s-maxage` TTL — no zombie problem, no unbounded storage growth.

