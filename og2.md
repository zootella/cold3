# OG Image: v5 → v6 Migration

**Starting point:** Nuxt 4.3.0, Tailwind 4.1.18, pnpm, branch `migrate1`. Everything works except og-image on Cloudflare Workers.

## The Problem

nuxt-og-image 5.1.13 returns 500 on Cloudflare Workers in production:

```
CompileError: WebAssembly.instantiate(): Wasm code generation disallowed by embedder
```

Works locally, fails in Workers. The satori renderer uses `yoga-wasm-web` for CSS layout. Workers requires WASM to be pre-compiled and imported as ES module bindings — runtime `WebAssembly.instantiate()` with raw bytes is blocked.

There's also a deeper Workers constraint: **cross-request I/O isolation**. When satori tries to fetch fonts from Google Fonts or load images from your own origin during rendering, Workers throws:

> "Cannot perform I/O on behalf of a different request. I/O objects (such as streams, request/response bodies, and others) created in the context of one request handler cannot be accessed from a different request's handler."

Node.js doesn't have this limitation. The satori renderer needs to fetch fonts and potentially images as part of SVG rendering, and these fetches fail under Workers' isolation model. This is why custom fonts and images are broken on Workers even when WASM itself loads — it's a separate, compounding problem.

**Ruled out:** Rolling back `compatibility_date` from `2025-09-27` to `2025-06-10` did not fix it (commit `61a1fe5`). The problem is in how Nitro 2.13.1 bundles the WASM for `cloudflare-module`, not a Cloudflare runtime policy change.

**No fix planned for v5.** The WASM fixes are going into v6 exclusively.

### Workers Renderer Compatibility (v5)

| Dependency | Supported on Workers | Notes |
|-----------|-----------|-------|
| satori | yes, via WASM | Default renderer, HTML/CSS → SVG |
| resvg | yes, via WASM | SVG → PNG conversion |
| chromium | no | No WASM binary support |
| sharp | no | No WASM support |
| css-inline | no | No WASM support on Workers |

Our v5 config doesn't explicitly disable the unsupported renderers. Adding this might help if v5 is attempting to load them:

```js
ogImage: {
	compatibility: {
		runtime: {
			chromium: false,
			sharp: false,
		}
	}
}
```

However, this likely won't fix the core WASM instantiation error — that's in the satori/yoga path, which is the one renderer that *should* work.

## Why v6

PR #437 ("Satori wasm binding, process proxy patch, and wasm `?module` imports") is the Cloudflare-specific fix:

1. Proper `?module` WASM imports — Workers requires WASM imported as ES modules
2. Process proxy patch — Workers doesn't have `process`, v5's satori had leaking `process.env` checks
3. Correct satori WASM initialization for edge runtimes

v6 also bundles Inter fonts by default, sidestepping the Google Fonts fetch-during-render problem (Workers I/O isolation blocks cross-request fetches for fonts/images).

## What We Use

Minimal usage — 2 pages, no custom templates, no custom fonts, no images in cards:

**`app/pages/index.vue`:**
```js
defineOgImageComponent('NuxtSeo', {
	title: `... static home card`,
	description: stickerText,
	theme: '#ff00ff',
	colorMode: 'light',
})
```

**`app/pages/card/[more].vue`:**
```js
defineOgImageComponent('NuxtSeo', {
	title: `... dynamic card for ${name1}`,
	description: stickerText,
	theme: '#ff00ff',
	colorMode: 'light'
})
```

**`nuxt.config.js`:**
```js
configuration.modules.push('nuxt-og-image')
configuration.site = {
	name: Key('domain, public'),
	url: 'https://'+Key('domain, public'),
}
configuration.ogImage = {
	defaults: {
		cacheMaxAgeSeconds: 20*Time.minutesInSeconds
	},
	runtimeCacheStorage: {
		driver: 'cloudflare-kv-binding',
		binding: 'OG_IMAGE_CACHE',
	},
}
```

**`wrangler.jsonc`:** KV namespace `OG_IMAGE_CACHE` bound for caching. Also has `nodejs_compat` in compatibility flags and `cloudflare_module` preset via nuxt.config. og.md's recommended Workers config includes explicit `main` and `assets` entries — we currently omit these (Nitro overrides them and warns). If WASM bundling issues persist after v6, adding them back is one thing to try.

## v6 Breaking Changes (relevant to us)

| Change | Impact |
|--------|--------|
| `defineOgImageComponent()` → `defineOgImage()` | 2 call sites in pages |
| Renderer deps unbundled — must install `satori` + `@resvg/resvg-wasm` | package.json adds |
| Community templates must be ejected for production | `npx nuxt-og-image eject NuxtSeo` |
| Component files need `.satori.vue` suffix | Only if we had custom templates (we don't) |
| URL paths: `/__og-image__/image/` → `/_og/d/` | Cache invalidation, test URLs change |
| UnoCSS runtime removed, uses Tailwind v4 build-time | Already on TW4 |
| `ogImage.fonts` config removed, custom fonts need `@nuxt/fonts` | We use defaults, not affected |
| Inter fonts bundled by default | Good — avoids Workers font fetch issues |

**Migration CLI available:**
```bash
npx nuxt-og-image migrate v6 --dry-run  # preview changes
npx nuxt-og-image migrate v6            # apply changes
```

## Known v5 Issues on Workers (for context)

- **[#63](https://github.com/nuxt-modules/og-image/issues/63):** Custom fonts and images broken (I/O isolation)
- **[#263](https://github.com/nuxt-modules/og-image/issues/263):** `.wasm` file loader errors
- **[#193](https://github.com/nuxt-modules/og-image/issues/193):** `script_too_large` on free tier (2.4MB WASM)
- **[#434](https://github.com/nuxt-modules/og-image/issues/434):** Same WASM `CompileError` we hit — remains open

## v6 Beta Status

As of Feb 5, 2026: `6.0.0-beta.15`. 15 betas in 13 days. Active development, still making breaking changes (renderer rename in beta.14, component resolution rework in beta.10). No RC yet.

**Previous attempt** (before Tailwind 4): `pnpm add nuxt-og-image@beta` installed 6.0.0-beta.15 but `nuxt prepare` crashed with `Cannot resolve module "tailwindcss"`. v6's CSS provider detection requires `tailwindcss@^4.0.0`. **This blocker is now cleared** — we're on Tailwind 4.1.18.

## Alternative Paths

**Path A: Prerender at build time** — generate OG images during build (Node.js available), deploy as static PNGs. Avoids runtime WASM entirely. But our `card/[more].vue` pages are dynamic — would need to enumerate all routes at build time.

**Path C: `@cf-wasm/og` directly** — bypass nuxt-og-image entirely with Cloudflare's own WASM-compatible OG library in a Nitro server route. High effort (rewrite), but stable and purpose-built for Workers.

## Trail Notes

*(active section — record what happens as we work)*

