# OG Image: v5 → v6 Migration

## Current Solution

OG image generation works locally and on Cloudflare Workers in production. We migrated from nuxt-og-image v5 (broken on Workers) to v6, and wrote custom `.satori.vue` templates to avoid community template runtime fetching (blocked by Workers I/O isolation).

**Packages added to `site/package.json`:**

```
"nuxt-og-image": "6.0.0-beta.15"   ← exact pin (carets don't float on prereleases)
"satori": "0.15.2"                  ← exact pin (deliberate ceiling, 0.16+ breaks Workers)
"@resvg/resvg-wasm": "^2.6.2"      ← caret, stable WASM binary
```

**Templates:** Two custom `.satori.vue` components in `app/components/OgImage/` — HomeCard (index page) and ProfileCard (card pages). Simple flex layouts, Inter font, white background with gray border.

**Rendering pipeline:**

```
HTML/CSS → [satori] → SVG → [resvg] → PNG
              ↑
           [yoga]
         (CSS layout)
```

All orchestrated by nuxt-og-image, which provides the Nuxt integration layer (`defineOgImage()` composable, `<meta og:image>` injection, KV caching).

### Packages in our build

Three are top-level in `site/package.json` (we added them):

| Package | Version | Does | Pin reason |
|---------|---------|------|------------|
| nuxt-og-image | 6.0.0-beta.15 | Nuxt integration, composable API, KV cache | Exact — carets don't float on prereleases |
| satori | 0.15.2 | HTML/CSS → SVG (Vercel) | Exact — 0.16+ breaks Cloudflare Workers |
| @resvg/resvg-wasm | ^2.6.2 | SVG → PNG via Rust/WASM | Caret — stable |

Two are transitive (pulled in by satori, not in our package.json):

| Package | Version | Does | Notes |
|---------|---------|------|-------|
| yoga-wasm-web | 0.3.3 | CSS flexbox layout (Facebook, C++/WASM) | Last release March 2023, 88.7 KB WASM |
| @shuding/opentype.js | 1.4.0-beta.0 | Font parsing for satori | Fork of opentype.js |

The largest artifact is resvg's 2.48 MB WASM binary.

### Worries

- **Satori is owned by Vercel.** They maintain it for `@vercel/og` on their own edge runtime. Satori 0.16+ switched to runtime `WebAssembly.instantiate()` which works on Vercel Edge Functions but is blocked on Cloudflare Workers. No fix planned ([vercel/satori#693](https://github.com/vercel/satori/issues/693)). Vercel has no incentive to accommodate a competitor's platform.
- **Pinned to exact versions.** `satori` is a deliberate ceiling (can't go higher on Workers), `nuxt-og-image` is pinned because semver carets don't float on prereleases. We're frozen at these exact versions until we manually update.
- **nuxt-og-image is beta, single maintainer.** Harlan Wilton, 15 betas in 13 days. Active but fragile bus factor.

### Hopes

- **nuxt-og-image figures this out for us.** The module already bridges the satori/Cloudflare gap with `esmImport: true` and the 0.15 WASM binding. As Nitro and nuxt-og-image mature, a build-time WASM transform that rewrites `WebAssembly.instantiate()` to pre-compiled imports is the most likely path to unlocking newer satori versions on Workers. We'd just update our dependencies and it works.
- **Cloudflare relaxes WASM restrictions.** As WASM grows in the ecosystem, Cloudflare may loosen runtime instantiation rules. This is a core security boundary though, so it may never happen.
- **v6 goes stable.** Once it does, we switch to `"nuxt-og-image": "^6.0.0"` and semver floats normally again.

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

### Deprecated vs removed

`defineOgImageComponent()` still exists in v6 — it's deprecated, not removed. The type definition says:

```ts
/** @deprecated Use `defineOgImage()` instead. This function will be removed in a future version.
 *  Migration: `defineOgImageComponent('X', props, options)` → `defineOgImage('X', props, options)` */
```

Same signature, same arguments, direct rename. We've done this rename (2 call sites).

**What a full v6 refactor would additionally involve** (not done, not blocking):
- **Eject community templates** — `npx nuxt-og-image eject NuxtSeo` copies the NuxtSeo template into the project as a local `.satori.vue` component. Required for production builds that can't fetch the template at runtime (Workers I/O isolation). Need to test whether this is actually required or if v6 bundles it automatically.
- **Custom OG image components** — if we ever write our own, they'd need the `.satori.vue` suffix and live in `components/OgImage/`. We don't have any currently.
- **URL path changes** — v6 shortens `/__og-image__/image/` to `/_og/d/`. The card test page (`card/[more].vue`) fetches the og:image meta content URL and displays it — this should work automatically since it reads from the meta tag, not a hardcoded path. But `?purge` cache invalidation URL changes.
- **nuxt.config.js `ogImage` block** — v6 types show the same `defaults`, `runtimeCacheStorage` config shape. No changes needed for our config.

## Known v5 Issues on Workers (for context)

- **[#63](https://github.com/nuxt-modules/og-image/issues/63):** Custom fonts and images broken (I/O isolation)
- **[#263](https://github.com/nuxt-modules/og-image/issues/263):** `.wasm` file loader errors
- **[#193](https://github.com/nuxt-modules/og-image/issues/193):** `script_too_large` on free tier (2.4MB WASM)
- **[#434](https://github.com/nuxt-modules/og-image/issues/434):** Same WASM `CompileError` we hit — remains open

## v6 Beta Status

As of Feb 5, 2026: `6.0.0-beta.15`. 15 betas in 13 days. Active development, still making breaking changes (renderer rename in beta.14, component resolution rework in beta.10). No RC yet.

**Previous attempt** (before Tailwind 4): `pnpm add nuxt-og-image@beta` installed 6.0.0-beta.15 but `nuxt prepare` crashed with `Cannot resolve module "tailwindcss"`. v6's CSS provider detection requires `tailwindcss@^4.0.0`. **This blocker is now cleared** — we're on Tailwind 4.1.18.

## Cloudflare + Satori: Long-Term Ceiling

Satori is maintained by Vercel for `@vercel/og`, optimized for their own edge runtime. Satori 0.16+ switched WASM loading to runtime `WebAssembly.instantiate()` — works on Vercel Edge Functions, blocked on Cloudflare Workers. GitHub issue [vercel/satori#693](https://github.com/vercel/satori/issues/693) has been open since the change, no fix planned.

nuxt-og-image v6's response: hardcode cloudflare-module to the `"0-15-wasm"` satori binding. This is a deliberate ceiling — any satori improvements after 0.15 (CSS support, bug fixes, features) don't reach Cloudflare users.

The dependency chain:
- **Cloudflare Workers** (our platform) blocks runtime WASM instantiation
- **Satori** (Vercel's tool) requires it from 0.16+
- **nuxt-og-image** (community module) bridges them by pinning to a stale satori version

This is stable for now — satori 0.15.2 works, our OG cards are simple, we don't need cutting-edge CSS layout.

Every path on Cloudflare Workers ends at the same wall: satori 0.15.2 is the last version that doesn't call `WebAssembly.instantiate()` at runtime. Whether you get there through nuxt-og-image v6, `@cf-wasm/og`, or a hand-rolled server route, you're running the same satori 0.15.2.

**`@cf-wasm/og`** (v0.3.5, ~1,000 weekly downloads, single maintainer) confirms this — it wraps `@cf-wasm/satori` which pins `satori: ^0.15.2` + `yoga-wasm-web: 0.3.3` with correct ESM imports for Workers. Same rendering engine, same version pin, just repackaged. No secret sauce. For comparison: nuxt-og-image gets 75k weekly downloads, `@vercel/og` gets 245k, raw satori gets 650k.

**Future options if satori 0.15 becomes a problem:**
1. Vercel adds edge-compatible WASM loading to satori (no incentive)
2. Cloudflare relaxes runtime WASM restrictions (possible as WASM grows, but a core security boundary)
3. Fork satori, patch WASM loading for edge (feasible if isolated, but ongoing maintenance)
4. Build-time WASM transform in Nitro/Vite that rewrites `WebAssembly.instantiate()` to pre-compiled imports (most likely eventual fix — both Nitro and nuxt-og-image are actively developed)
5. Drop satori entirely for a different renderer or `@cf-wasm/og` as escape hatch
6. Move OG generation off-Workers to Lambda or external service

## Alternative Paths

**Path A: Prerender at build time** — generate OG images during build (Node.js available), deploy as static PNGs. Avoids runtime WASM entirely. But our `card/[more].vue` pages are dynamic — would need to enumerate all routes at build time.

**Path C: `@cf-wasm/og` directly** — bypass nuxt-og-image entirely with Cloudflare's own WASM-compatible OG library in a Nitro server route. Single maintainer, 1k downloads/week, same satori 0.15.2 pin. Loses all Nuxt integration (composables, meta tag injection, dev preview, KV caching config, community templates). Main value: simpler escape hatch if nuxt-og-image becomes unmaintained.

## Process

```bash
cd site
ja remove nuxt-og-image
ja add nuxt-og-image@beta satori @resvg/resvg-wasm
cd ..
```

then, following our standard process for our pipeline, any time we change a package.json, we do this:

```bash
ja wash #delete modules folders, but keep the lockfile
ja install #install modules from package.json declarations and lockfile references
ja test #make sure unit tests pass running locally from node
ja sem #generate a new sem.yaml showing what versions we have of all packages in all package.json files
ja seal #compute wrapper.txt and wrapper.js, which has the hash prefix like "ABC" we can use to identify this version in production

cd site
ja build #see that the nuxt site builds without errors
cd ..

git diff > diff.diff #and if all of that works, then we generate a diff, and review it
```

so it's not uncommon (unfortunately) for things to break as we try to move forward on this path
for instance, tests could not pass
or, the site could not build
so, the first thing we do is try to get to the  point where we can generate a diff of a repo that passes tests and builds

once we get there, then we review the diff. note that we stil lhaven't run any code yet!

and then when we're happy with the diff (usually after more refactoring) then we repeat everything to the diff, and only then do we run local (ja is pnpm, local is dev) and navigate to localhost 3000

```bash
cd site
ja local
```

## Plan

1. ☐ **Packages** remove `nuxt-og-image` 5.1.13, add `nuxt-og-image@beta` (v6) + `satori` + `@resvg/resvg-wasm`. Run sem, review diff.
2. ☐ **Eject template** — `npx nuxt-og-image eject NuxtSeo` to copy the community template into the project so it ships with the build.
3. ☐ **Code changes** — `defineOgImageComponent('NuxtSeo', {...})` → `defineOgImage({...})` in `app/pages/index.vue` and `app/pages/card/[more].vue`. Review `nuxt.config.js` `ogImage` block for v6 config shape changes.
4. ☐ **Test locally** — `pnpm dev`, hit `/_og/d/` (new v6 path, was `/__og-image__/image/`), verify both pages generate images.
5. ☐ **Deploy and test production** — `ja cloud`, hit og-image endpoint on production Workers, verify WASM fix works.

## Trail Notes

*(active section — record what happens as we work, with detail, each step of the way a new level 3 section)*

### Packages: remove v5, add v6 + renderer deps

```bash
cd site
ja remove nuxt-og-image        # removed 5.1.13, clean
ja add nuxt-og-image@beta satori @resvg/resvg-wasm
# installed: nuxt-og-image 6.0.0-beta.15, satori 0.19.1, @resvg/resvg-wasm 2.6.2
```

Install succeeded but `nuxt prepare` (runs as postinstall) emitted:

```
[nuxt-og-image] ERROR Satori 0.19.1 is incompatible with edge runtimes (cloudflare-module).
Satori 0.16+ uses WebAssembly.instantiate() which is blocked by edge platforms.
Pin satori to 0.15.x in your package.json: "satori": "0.15.2".
See: https://github.com/vercel/satori/issues/693
```

This is `logger.error()`, not a throw — `nuxt prepare` continued and completed. But the warning is real.

### Investigation: satori version constraint

Dug into v6's source at `nuxt-og-image/dist/shared/nuxt-og-image.D60pF5oX.mjs`. Found:

**RuntimeCompatibility for cloudflare:**
```js
const cloudflare = {
  "satori": "0-15-wasm",   // hardcoded to 0.15 WASM path
  "resvg": "wasm",
  "wasm": {
    esmImport: true,        // this is the PR #437 fix — ?module imports
    lazy: true
  }
};
```

**The version check (line 2600-2608):** if preset is edge/WASM and satori >= 0.16, log the error. This isn't a bypass-able config — v6 is *designed* to use satori 0.15.x on Cloudflare. Satori 0.16+ changed its WASM loading to use runtime `WebAssembly.instantiate()`, which edge runtimes block. The `esmImport: true` fix (PR #437) only works with satori 0.15's WASM loading pattern.

**Conclusion:** pin satori to 0.15.2 as instructed. This is the intended v6 path for Cloudflare, not a workaround.

**Next:** `pnpm remove satori && pnpm add satori@0.15.2`, then continue with wash/install/test/sem/seal/build pipeline.

### Pin satori, pipeline, build — all pass

Pinned satori to 0.15.2. wash → install → test (912+178 assertions) → sem → seal (`4JOEXWA`) → build all clean. No satori version error on `nuxt prepare`.

### Version pinning: semver carets don't float on prereleases

`nuxt-og-image` is pinned to exact `6.0.0-beta.15` (no caret). This is because **carets on prerelease versions don't float** in semver — `^6.0.0-beta.15` would only match `6.0.0-beta.15` exactly, not beta.16 or beta.17. There's no semver range that means "latest beta." To update, run `pnpm add nuxt-og-image@beta` again — it pulls whatever the current `beta` dist-tag points to. Once v6 goes stable and becomes the `latest` tag, switch to `"nuxt-og-image": "^6.0.0"` and it floats normally.

`satori` is pinned to exact `0.15.2` for a different reason — it's a deliberate ceiling, not a publishing quirk. Newer versions break on Cloudflare.

### Code changes: defineOgImageComponent → defineOgImage

Renamed in 2 files (`app/pages/index.vue`, `app/pages/card/[more].vue`). Same signature, direct rename. `defineOgImageComponent` still works in v6 (deprecated, not removed) but we migrate now to avoid a future breaking removal.

nuxt.config.js `ogImage` block unchanged — v6 accepts the same config shape.

**Next:** test → build, then review whether template ejection is needed before running locally.

### Local works, production 500 — template ejection required

Tests pass, build passes, OG images generate locally (HTTP 200, 78KB PNG from `/_og/d/`). Deployed to production. Result:

```json
{
  "statusCode": 500,
  "message": "Community template \"NuxtSeoSatori\" must be ejected before production use. Run: npx nuxt-og-image eject NuxtSeoSatori"
}
```

v6 can't fetch community templates at runtime on Workers (I/O isolation). They must be local files. The eject CLI lists the template as `NuxtSeo` (not `NuxtSeoSatori` as the error says).

Rather than ejecting the NuxtSeo community template (which gives us someone else's opinionated component), we wrote three custom `.satori.vue` templates from scratch in `app/components/OgImage/`: HomeCard (magenta), ProfileCard (dark navy), PostCard (slate). Updated both pages to use `defineOgImage('HomeCard', ...)` and `defineOgImage('ProfileCard', ...)`.

Also removed stray `@resvg/resvg-js` that appeared in package.json (native Node bindings, can't run on Workers). Full pipeline re-run: wash → install → test → sem → seal → build.

### Production works

Local smoke tests pass. Deployed to production. Both cards generate on Cloudflare Workers:

- **HomeCard** (index page): HTTP 200, 23KB PNG
- **ProfileCard** (card/name1234): HTTP 200, 24KB PNG

The v5 WASM `CompileError` is resolved. The fix was the combination of:
- nuxt-og-image v6 with `wasm: { esmImport: true }` (PR #437) — pre-compiled WASM module imports
- satori 0.15.2 — last version with edge-compatible WASM loading
- Custom `.satori.vue` templates — avoids community template runtime fetch (Workers I/O isolation)

Note: bare `/_og/d/` requests without a `c_` component parameter still 500 (falls back to unejected NuxtSeoSatori). This only affects direct URL construction — actual pages include `c_HomeCard` or `c_ProfileCard` in their og:image meta tags automatically.

### Font capabilities in satori templates

**Bundled fonts:** v6 ships Inter in two weights — `inter-400-latin.ttf` (65KB, normal) and `inter-700-latin.ttf` (66KB, bold). Latin character coverage only. These require zero configuration and are what our templates use via `fontFamily: 'Inter, sans-serif'`.

**Weight mapping:** Our templates specify `fontWeight: 900` but the heaviest bundled weight is 700. Satori uses the closest available weight, so titles render at 700 (bold).

**Emoji:** Fully supported out of the box. v6 uses `emoji-regex-xs` to detect emoji characters and converts them to inline SVGs automatically. Our `🏠` in HomeCard works on both local and production.

**Non-English characters (CJK, Arabic, etc.):** Satori 0.15.2 has built-in locale detection for Japanese, Korean, Chinese (simplified/traditional/HK), Thai, Bengali, Arabic, Hebrew, Tamil, Malayalam, Telugu, Devanagari, and Kannada. It uses a `loadAdditionalAsset` callback to request fonts when it encounters these character ranges. However, nuxt-og-image only bundles Inter Latin — CJK or other scripts would render as fallback/missing glyphs unless you add appropriate fonts (like Noto Sans CJK) via the `@nuxt/fonts` module.

**Custom fonts:** Two approaches in v6:
1. **`@nuxt/fonts` module** (recommended) — configure font families in `nuxt.config.js`
2. **Google Fonts** — already referenced in our nuxt.config head links (Noto Sans, Noto Sans Mono, Roboto), but these are for the page, not automatically available to satori

**Cloudflare Workers font loading:** Fonts are served from the Wrangler ASSETS binding (preferred) or fetched via HTTP fallback. TTF preferred — WOFF2 gets converted to TTF for satori. Font data cached in LRU in-memory cache.

**Bottom line:** For our current templates (English text + emoji), defaults are fully sufficient. CJK/non-Latin would require adding fonts via `@nuxt/fonts`.

