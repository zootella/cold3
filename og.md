# OG Image

## How It Works

OG image generation works locally and on Cloudflare Workers in production. Pages call `defineOgImage()` with a template name and props. nuxt-og-image handles meta tag injection, KV caching, and orchestrates rendering:

```
HTML/CSS → [satori] → SVG → [resvg] → PNG
              ↑
           [yoga]
         (CSS layout)
```

**Templates:** Two custom `.satori.vue` components in `app/components/OgImage/` — HomeCard (index page) and ProfileCard (card pages). Simple flex layouts, Inter font, white background with gray border. These must be local files, not community templates, because Workers I/O isolation blocks runtime fetching.

**Pages:** `index.vue` calls `defineOgImage('HomeCard', {sticker})`. `card/[more].vue` calls `defineOgImage('ProfileCard', {title, sticker})`.

**Config** in `nuxt.config.js`: module registered, `site` block for absolute URLs, `ogImage` block with 20-minute cache TTL and `cloudflare-kv-binding` driver pointing to `OG_IMAGE_CACHE` KV namespace.

### Packages

Three top-level in `site/package.json`:

| Package | Version | Does | Pin reason |
|---------|---------|------|------------|
| nuxt-og-image | 6.0.0-beta.15 | Nuxt integration, composable API, KV cache | Exact — carets don't float on prereleases |
| satori | 0.15.2 | HTML/CSS → SVG (Vercel) | Exact — 0.16+ breaks Cloudflare Workers |
| @resvg/resvg-wasm | ^2.6.2 | SVG → PNG via Rust/WASM | Caret — stable |

Two transitive (pulled in by satori):

| Package | Version | Does |
|---------|---------|------|
| yoga-wasm-web | 0.3.3 | CSS flexbox layout (Facebook, C++/WASM) |
| @shuding/opentype.js | 1.4.0-beta.0 | Font parsing for satori |

The largest artifact is resvg's 2.48 MB WASM binary.

To update nuxt-og-image to a newer beta: `pnpm add nuxt-og-image@beta`. Once v6 goes stable: switch to `"nuxt-og-image": "^6.0.0"` and semver floats normally.

### Fonts

Inter bundled in two weights (400 normal, 700 bold), Latin only. Emoji works out of the box (converted to inline SVGs). CJK/non-Latin would need fonts added via `@nuxt/fonts`. The Google Fonts in our nuxt.config head links (Noto Sans, Roboto) are for page rendering, not available to satori.

### Cache

Config sets 20-minute TTL via `cacheMaxAgeSeconds` with `cloudflare-kv-binding` driver pointing to `OG_IMAGE_CACHE` KV namespace. To purge a cached image, append `?purge` to its og:image URL from the page's meta tags.

**☐ Verify after migration:**
1. KV store is receiving cached images (check OG_IMAGE_CACHE in Cloudflare dashboard)
2. Cached images expire after 20 minutes (not lingering indefinitely)
3. Second request for the same image serves from KV cache, not a fresh regeneration (check response time or `wrangler tail`)

### Known Issues

- Bare `/_og/d/` requests without a `c_` component parameter 500 (falls back to unejected NuxtSeoSatori community template). Doesn't affect real pages — their og:image meta tags include `c_HomeCard` or `c_ProfileCard` automatically.

## The Satori Ceiling

Satori is Vercel's tool, maintained for `@vercel/og` on their edge runtime. Satori 0.16+ switched to runtime `WebAssembly.instantiate()` — works on Vercel Edge Functions, blocked on Cloudflare Workers ([vercel/satori#693](https://github.com/vercel/satori/issues/693), no fix planned).

nuxt-og-image v6 bridges this by hardcoding `cloudflare-module` to the `"0-15-wasm"` satori binding with `esmImport: true` (PR #437). This is a deliberate ceiling — satori improvements after 0.15 don't reach Cloudflare users.

Every path on Cloudflare Workers ends at this wall. Whether through nuxt-og-image, `@cf-wasm/og`, or a hand-rolled server route, you're running satori 0.15.2. Stable for now — our cards are simple, we don't need cutting-edge CSS layout.

### Worries

- **Satori is Vercel's.** No incentive to accommodate a competitor's platform.
- **Pinned to exact versions.** Frozen until we manually update.
- **nuxt-og-image is beta, single maintainer** (Harlan Wilton). Active but fragile bus factor.

### Hopes

- **Build-time WASM transform.** As Nitro and nuxt-og-image mature, a transform that rewrites `WebAssembly.instantiate()` to pre-compiled imports could unlock newer satori on Workers. We'd just update deps.
- **Cloudflare relaxes WASM restrictions.** Possible as WASM grows, but it's a core security boundary.
- **v6 goes stable.** Semver floats normally, less manual pinning.
