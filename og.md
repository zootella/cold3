# Nuxt OG Image on Cloudflare Workers: Research & Findings

**Date:** February 5, 2026  
**Stack:** Nuxt 4, nuxt-og-image 5.1.13, Cloudflare Workers  
**Status:** Works locally, broken in production on Workers

---

## 1. The Nuxt 4 / h3 / Nitro Version Landscape

### Current Release Boundaries

Nuxt 4 (stable July 15, 2025, currently at ~4.3) ships with **Nitro v2 and h3 v1**. The h3 v2 / Nitro v3 migration is explicitly scoped to **Nuxt 5**, which has no release date yet.

Daniel Roe's roadmap post is clear: Nuxt 4 and Nitro v3 were intentionally decoupled so the ecosystem could migrate in stages:

- **v3 → v4**: App-layer changes (directory structure, data fetching, Unhead v2)
- **v4 → v5**: Server-layer changes (h3 v2, Nitro v3, Vite Environment API)

### h3 v2 Leaking Into v4 Builds

There is a filed issue ([nuxt/nuxt#34109](https://github.com/nuxt/nuxt/issues/34109), ~3 weeks old) where h3 v2.0.1-rc.8 was resolved into a Nuxt 4.2.2 build via transitive dependencies, breaking the build because h3 v2 removed exports like `send` that Nuxt 4's error handler still imports from h3 v1.

**Mitigation:** Pin h3 to v1.x in package.json resolutions to prevent transitive hoisting:

```json
"resolutions": {
  "h3": "^1.13.0"
}
```

### Forward-Compatibility Shims in Nuxt 4.3

Nuxt 4.3 (latest minor, released as v3.21 backport) has begun adding forward-compatibility for h3 v2. For example, `createError()` now accepts both old and new property names:

```js
// Old (h3 v1, still works)
throw createError({ statusCode: 404, statusMessage: 'Not Found' })

// New (h3 v2 style, now also works in Nuxt 4.3+)
throw createError({ status: 404, statusText: 'Not Found' })
```

These are soft deprecations, not a full h3 v2 adoption.

---

## 2. nuxt-og-image Version Tracks

There are three relevant version tracks:

| Version | Status | Notes |
|---------|--------|-------|
| **v5.1.x** | Stable, current | Requires Nuxt ≥3.16. Works with Nuxt 4. Documented on nuxtseo.com. |
| **v6.0.0-beta.15** | Beta (released Feb 5, 2026) | Major rewrite with significant breaking changes. Active WASM/Workers fixes. |
| **v4.x** | Legacy | Removed deprecations, added Nuxt SEO v2 support. Do not use. |

For Nuxt 4 + Cloudflare Workers today, **v5.1.x is the "right" stable version**, but it has known, unresolved issues on Workers (see below).

---

## 3. Cloudflare Workers: The Known-Broken Target

### Official Compatibility Matrix (v5)

The nuxt-og-image compatibility docs list these constraints for **Cloudflare Workers**:

| Dependency | Supported | Notes |
|-----------|-----------|-------|
| **satori** | ✅ via WASM | Default renderer, works on all environments |
| **resvg** | ✅ via WASM | SVG → PNG conversion |
| **chromium** | ❌ | No WASM binary support |
| **sharp** | ❌ | No WASM support |
| **css-inline** | ❌ | No WASM support on Workers |

The docs also note: *"There is an open issue for custom fonts and images being broken in Cloudflare Workers. Please reply to the issue if you need this fixed."*

### The Core Problem: Workers I/O Isolation

The root cause of "works locally, breaks in production" is Workers' **cross-request I/O isolation**. When nuxt-og-image's Satori renderer tries to fetch fonts from Google Fonts or load images from your own origin during OG image rendering, Workers throws:

> "Cannot perform I/O on behalf of a different request. I/O objects (such as streams, request/response bodies, and others) created in the context of one request handler cannot be accessed from a different request's handler."

This is a fundamental Workers constraint that Node.js doesn't have. The Satori renderer needs to fetch fonts and potentially images as part of SVG rendering, and these fetches fail under Workers' isolation model.

### Known Issues (GitHub)

- **[#63](https://github.com/nuxt-modules/og-image/issues/63)** (July 2023, still open): Custom fonts and images broken on Cloudflare Workers. The I/O isolation error manifests when fetching Google Fonts.
- **[#263](https://github.com/nuxt-modules/og-image/issues/263)** (Sept 2024): `.wasm` file loader errors on Cloudflare Pages — `No loader is configured for ".wasm" files`.
- **[#193](https://github.com/nuxt-modules/og-image/issues/193)** (April 2024): `script_too_large` error on Cloudflare Pages free tier — the compiled WASM file is 2.4MB, exceeding the 1MB worker limit.
- **Unsupported image type: unknown** (May 2025, AnswerOverflow): Images from `public/` fail on Workers because Workers doesn't serve static assets with correct Content-Type headers the way Pages does.
- **OOM during prerender** (Oct 2025, Cloudflare Community): `@resvg/resvg-wasm` causes JavaScript heap memory exhaustion during Nuxt build with `cloudflare-module` preset.

---

## 4. Why v6 Beta Exists (and Why It Matters for Workers)

The v6 beta releases contain **specifically targeted fixes** for the Workers WASM story. Key changes:

### PR #437: "Satori wasm binding, process proxy patch, and wasm `?module` imports"

This is the Cloudflare-specific fix. It addresses:

1. **Proper `?module` WASM imports** — Workers requires WASM to be imported as ES modules (`import wasm from './foo.wasm?module'`), and v5 didn't handle this correctly
2. **Process proxy patch** — Workers doesn't have `process`, and v5's Satori integration had edge cases where `process.env` checks leaked through
3. **Satori WASM binding** — Correct initialization path for Satori's WASM backend in edge runtimes

### v6 Breaking Changes Relevant to Workers Migration

**Renderer dependencies are unbundled.** You must install explicitly based on runtime:

```bash
# For Cloudflare Workers (edge runtime)
npm i satori @resvg/resvg-wasm

# For Node.js
npm i satori @resvg/resvg-js
```

**Component files require a renderer suffix:**

```
# Before (v5)
components/OgImage/MyTemplate.vue

# After (v6)
components/OgImage/MyTemplate.satori.vue
```

**Community templates must be ejected for production:**

```bash
npx nuxt-og-image eject NuxtSeo
```

**`defineOgImageComponent()` deprecated** in favor of `defineOgImage()`:

```js
// Before (v5)
defineOgImageComponent('NuxtSeo', { title: 'Hello' })

// After (v6)
defineOgImage('NuxtSeo', { title: 'Hello' })
```

**Inter fonts bundled by default** — sidesteps the Google Fonts fetch-during-render problem for the default case.

**UnoCSS runtime removed** — replaced with native Tailwind v4 build-time processing.

**Font config changed** — `ogImage.fonts` config removed. Custom fonts require `@nuxt/fonts` module.

**URL paths shortened:**

| v5 | v6 |
|----|-----|
| `/__og-image__/image/` | `/_og/d/` |
| `/__og-image__/static/` | `/_og/s/` |
| `/__og-image__/font/` | `/_og/f/` |

**Migration CLI available:**

```bash
npx nuxt-og-image migrate v6 --dry-run  # preview changes
npx nuxt-og-image migrate v6            # apply changes
```

---

## 5. What the Community Does (Three Paths)

### Path A: Prerender OG Images at Build Time (v5 safe path)

Avoid runtime generation entirely. Use `nuxi generate` or configure route rules to prerender OG image routes. Images are generated during build (where Node.js is available) and deployed as static assets.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/__og-image__/**': { prerender: true }
  }
})
```

### Path B: Upgrade to v6 Beta (where the fix lives)

The actual Workers WASM fixes are in v6. Migration steps:

1. Install v6: `npm i nuxt-og-image@next`
2. Install renderer deps: `npm i satori @resvg/resvg-wasm`
3. Run migration CLI: `npx nuxt-og-image migrate v6`
4. Eject community templates: `npx nuxt-og-image eject NuxtSeo`
5. Verify `.satori.vue` suffixes on OG components

### Path C: Bypass nuxt-og-image, Use `@cf-wasm/og` Directly

Use Cloudflare's own WASM-compatible OG image library in a Nitro server route, bypassing nuxt-og-image entirely. Documented in a [DEV Community article](https://dev.to/jdgamble555/using-og-image-outside-of-node-22f) (Nov 2025):

```ts
// nuxt.config.ts
import additionalModules from "@cf-wasm/plugins/nitro-additional-modules"

export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare-module',
    modules: [additionalModules({ target: "edge-light" })],
  }
})
```

---

## 6. Recommended Configuration (v5, if staying stable)

### nuxt.config.ts

```ts
export default defineNuxtConfig({
  ogImage: {
    compatibility: {
      runtime: {
        chromium: false,
        sharp: false,
        // css-inline: false,  // if getting WASM errors
      }
    }
  }
})
```

### Cloudflare Workers Setup

- Use the `cloudflare-module` preset (not `cloudflare-pages`)
- Ensure `nodejs_compat` is in `compatibility_flags` in `wrangler.toml`
- For images in OG templates: avoid self-fetching from your own origin (`/images/foo.png`). Use absolute external URLs or base64-encoded images as a workaround for the Content-Type header issue.

### wrangler.toml

```toml
compatibility_date = "2025-07-15"
compatibility_flags = ["nodejs_compat"]
main = "./.output/server/index.mjs"

[assets]
binding = "ASSETS"
directory = "./.output/public/"
```

---

## 7. Summary & Recommendation

| Approach | Stability | Workers Support | Effort |
|----------|-----------|----------------|--------|
| v5.1.x + prerender | Stable | ✅ (build-time only) | Low |
| v6 beta | Beta | ✅ (runtime, active fixes) | Medium |
| `@cf-wasm/og` direct | Stable (different lib) | ✅ | High (rewrite) |

**For the cold3 project:** The v6 beta path is the most pragmatic. The v5 Workers story is documented as broken with no fix planned for v5 — the fixes are going into v6 exclusively. v6.0.0-beta.15 dropped today (Feb 5, 2026) with continued WASM fixes. The migration CLI automates most of the breaking changes.

If beta risk is unacceptable, prerendering OG images at build time is the reliable v5 fallback — Satori runs in Node during build, and Workers just serves the resulting static PNGs.