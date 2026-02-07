
# Summary, 2026feb

Annual stack upgrade, completed February 2026. Moved major versions of the package manager, framework, CSS framework, and OG image module forward simultaneously, then fixed everything until unit tests and smoke tests passed in both dev and production.

**Package manager:** Yarn Classic → pnpm 10. Updated sem.js to read pnpm lockfile. Removed `pino-pretty` (a yarn workaround for unresolved peer deps that pnpm handles natively).

**Framework:** Nuxt 3 → Nuxt 4.3.0 (Nitro 2.13.1, Vite 6). Restructured into `site/app/` directory. Replaced `process.client`/`process.server` with compile-time `import.meta.client`/`import.meta.server`. Abstracted h3 access behind four `getWorker*` functions in icarus/level2.js for the eventual h3 v2 migration (which is Nuxt 5, not 4 — a lesson learned the hard way when the scaffold's h3 v2 devDep broke og-image).

**CSS:** `@nuxtjs/tailwindcss` (Nuxt module wrapping Tailwind 3) → `@tailwindcss/vite` (Tailwind 4 as a direct Vite plugin). Eliminated `tailwind.config.js` — all config now lives in CSS via `@import`, `@theme`, `@plugin`. Fixed a silent Google Fonts CSS2 bug (unsorted axis tuples → HTTP 400, all three linked fonts were failing on production).

**OG image:** nuxt-og-image 5 → 6.0.0-beta.15. Forced by a WASM bundling break on Cloudflare Workers with Nitro 2.13.1 (v5 has no fix, v6 only). v6 in turn required Tailwind 4 — so "upgrade Nuxt" cascaded into three stacked migrations.

**Version cleanup:** Bumped 12 stale packages to `^<installed>` so the stack rides semver ranges forward instead of depending on an old lockfile.

# Remaining Action Items

Extracted from migrate.md, tailwind.md, og.md. One entry per item, do it here, check it off here.

## [] Test error handling

Throw an exception in a component deliberately. Verify the full path: server-side logs to Datadog, client shows error.vue, pageStore has the error details. Test both SSR (fresh page load in new tab) and client-side (SPA navigation via NuxtLink) error paths.

Relevant code: `app/plugins/errorPlugin.js`, `app/error.vue`. errorPlugin uses `app:error` hook, `vue:error` hook, `showError()`, `createError()`, and accesses `usePageStore()` — any of these could have shifted in Nuxt 4.

☐ SSR error path works
☐ Client-side SPA error path works

## [] Test environment detection

Log `senseEnvironment()` output in all four contexts: local dev server, local page client, deployed server, deployed client. Compare the `found` tags against the pattern table in `_senseEnvironment`. Also verify `isLocal()` and `isCloud()` return correct values in each context — these read `wrapper.cloud` (build-time text replace by set-cloud.js), separate from senseEnvironment, but worth confirming after the `import.meta.client`/`import.meta.server` change from Chapter 2.

If patterns drift, update `_senseEnvironment` and increment `_senseEnvironmentVersion`.

☐ All four contexts produce correct Sticker strings
☐ `isLocal()`/`isCloud()` correct in each context

## [] Test Pinia hydration in universal rendering

Three stores (mainStore, credentialStore, flexStore) use a `loaded` ref guard to prevent double-fetching. `app.vue` calls `await mainStore.load()` during server render, sets `loaded = true`, client receives hydrated state, and `load()` becomes a no-op. pageStore is client-only with no guard.

Test: open a route in a new tab (SSR path — `<script setup>` runs on server, renders HTML, hydrates client). Then from an already-loaded page, navigate via NuxtLink to the same component (SPA path — `<script setup>` runs on client). Confirm both paths work and Pinia state bridges correctly.

☐ SSR first-paint path works
☐ SPA navigation path works

## Verify og-image KV cache

After deployment, confirm the caching layer is actually working on Cloudflare:

- Check `OG_IMAGE_CACHE` KV namespace in Cloudflare dashboard — are cached images appearing?
- Check that cached images expire after 20 minutes (not lingering indefinitely)
- Second request for the same image should serve from KV cache, not regenerate (check response time or `wrangler tail`)

☐ KV cache receiving images
☐ TTL expiry working
☐ Cache hits confirmed

## Test nuxi analyze

Verify the bundle analysis reports still generate after migration.

`npx nuxi analyze`

☐ client.html and nitro.html size reports generate

# Tailwind CSS

## How It Works

**Tailwind v4** via `@tailwindcss/vite` — a Vite plugin, not a Nuxt module. Registered in `nuxt.config.js` alongside vidstack. No `tailwind.config.js` — all configuration lives in CSS.

**Global stylesheet** at `site/app/assets/css/style.css`:
- `@font-face` declarations for two bundled woff2 fonts (Diatype Rounded, Lemon Wide)
- `@import "tailwindcss"` — single import replaces the old three `@tailwind` directives
- `@plugin "@tailwindcss/forms"` — normalizes form controls
- `@theme` — overrides `--font-sans` (Diatype Rounded → Noto Sans → system) and `--font-mono` (Noto Sans Mono → system)
- `@layer base` — body defaults, link colors, code styling
- `@layer components` — `.my-button`, `.my-link`, and state classes (`.ghost`, `.ready`, `.doing`)

### Packages

| Package | Version | Role |
|---|---|---|
| tailwindcss | ^4.1.18 | The framework |
| @tailwindcss/vite | ^4.1.18 | Vite plugin (replaces the old `@nuxtjs/tailwindcss` Nuxt module) |
| @tailwindcss/forms | ^0.5.10 | Form control normalization plugin |

### Fonts

Three delivery methods, all independent of Tailwind:

| Font | Source | Used as |
|---|---|---|
| Diatype Rounded | Bundled woff2 in `public/fonts/` | Default body font (`--font-sans`) |
| Lemon Wide | Bundled woff2 in `public/fonts/` | Decorative (via plain CSS) |
| Noto Sans, Noto Sans Mono, Roboto | Google Fonts CDN link in nuxt.config.js | Sans fallback, code font (`--font-mono`), terms document |

System fallback stacks at the tail of every font-family list.

### Component Styling Patterns

Out of ~70 Vue files, three patterns:

- **Utility classes in templates** (~57 files, dominant). Classes directly on elements, no `<style>` block. Preferred default.
- **Scoped `@apply`** (9 files). Named class wrapping Tailwind utilities. Requires `@reference "tailwindcss"` at top of the `<style scoped>` block.
- **Raw scoped CSS** (4 files). Fixed positioning, pixel values, `!important` overrides — things Tailwind can't express.

## Things That Bite

### @reference is required for scoped @apply

In v4, `@apply` in `<style scoped>` can't resolve Tailwind classes without `@reference "tailwindcss"` at the top. Anyone adding a new component with scoped `@apply` must include this line or the build fails with "Cannot apply unknown utility class."

9 components currently have it: CredentialCorner, CredentialPanel, SignUpOrSignInForm, PostPage, ProfilePage, TermsPage, TermsComponent, TermsDocument, TermsAnchors.

### Custom font utilities don't work in scoped @apply

`@reference "tailwindcss"` gives access to Tailwind's built-in utilities, but not to custom names defined in our `@theme`. The built-in `font-sans` and `font-mono` work because Tailwind knows those names — our `@theme` just overrides their values. But if we defined `--font-roboto` in `@theme`, `@apply font-roboto` would fail in any scoped style block.

**The rule:** For one-off font choices, use plain CSS (`font-family: "Roboto", sans-serif`) instead of a Tailwind utility. The browser knows the font because the Google Fonts `<link>` loaded it. No Tailwind involvement needed. This is what TermsDocument.vue and TermsComponent.vue do for Roboto.

Pointing `@reference` at our stylesheet instead of `"tailwindcss"` would fix this, but requires a subpath import (Vite aliases don't work inside `@reference`) and heavier compilation. Not worth it for two font references.

### Google Fonts CSS2 API requires sorted axis tuples

Found and fixed during migration: the Google Fonts URL had unsorted axis tuples (`ital,wght@0,400;1,400;0,700;1,700`), which the CSS2 API silently rejects with HTTP 400. All three linked fonts were failing to load on production — pages rendered in system fonts instead. The fix: sort numerically (`ital,wght@0,400;0,700;1,400;1,700`). Also removed the `&subset=latin,latin-ext` parameter (CSS v1 API feature; CSS2 handles subsetting automatically via `unicode-range`).

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
- KV store is receiving cached images (check OG_IMAGE_CACHE in Cloudflare dashboard)
- Cached images expire after 20 minutes (not lingering indefinitely)
- Second request for the same image serves from KV cache, not a fresh regeneration (check response time or `wrangler tail`)

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

# Miscellaneous

## [5] Migration: Nuxt 4

Nuxt's official upgrade path is incremental: enable compatibility mode, run codemods, then upgrade. This section documents those tools as reference — they may be useful, but they're not necessarily our plan.

The fresh scaffolding approach is different: start from a known-good Nuxt 4 + Cloudflare scaffold and port code into it, or use it as reference for rapid updates. Nuxt's codemods don't know about Cloudflare, so they may preserve vestiges that a fresh `pnpm create cloudflare@latest` wouldn't have.

### Error Handling

Error handling hooks into Nuxt's internals (`app:error`, `vue:error` hooks, `showError`/`createError` utils, `error.vue`, plugin execution order relative to Pinia). Any of these could shift in Nuxt 4 — changed signatures, different plugin timing, moved file locations. If error handling breaks silently, exceptions get swallowed and we lose visibility into production failures.

**Nuxt APIs to verify against Nuxt 4 docs:** `app:error` hook, `vue:error` hook, `showError()`, `createError()` — all used in `app/plugins/errorPlugin.js`. Also: `app/error.vue` location after `app/` directory move, and plugin execution order relative to Pinia (errorPlugin accesses `usePageStore()`).

**☐ Test by deliberately throwing:** Trigger an exception in a component and verify the full path works: server-side logs to Datadog, client shows error.vue, pageStore has the error details. Test both SSR (fresh page load) and client-side (SPA navigation) error paths.

### Environment Detection (Sticker)

`senseEnvironment()` is a fuzzy system that probes for globals (`process`, `window`, `$fetch`, etc.) and pattern-matches to identify the runtime context (LocalVite, CloudNuxtServer, CloudPageClient, etc.). This feeds `Sticker()`, which generates debug strings like `"LocalVite.2025jun26.PKM3EYY.Fri10:21a..."` for error logging, API debugging, and test summaries.

**☐ Retest after migration:** Nuxt 4 may change what globals are available — different bundler behavior, different polyfills, Vite 6 vs Vite 5. The `process.client`/`process.server` probes were already updated to `import.meta.*` (Chapter 2), but other probes could drift. Log `senseEnvironment()` output in each context (local dev server, local page client, deployed server, deployed client) and compare the `found` tags against the pattern table. If patterns drift, update `_senseEnvironment` and increment `_senseEnvironmentVersion`.

## [6] Migration: Modules

### Pinia

Stores moved to `app/stores/`. No hydration errors surfaced. The SSR pattern is intact:

Three stores (mainStore, credentialStore, flexStore) use a `loaded` ref guard to prevent double-fetching — `app.vue` calls `await mainStore.load()` during server render, sets `loaded = true`, client receives hydrated state and `load()` becomes a no-op. `pageStore` is intentionally client-only (UI state) with no guard. **Discipline rule:** every store that fetches during SSR must have the `loaded` guard.

**☐ Formally test SSR behavior post-migration:** When a new tab GETs a route, `<script setup>` runs on the server (store loads, renders HTML, hydrates client). When an already-loaded SPA navigates via NuxtLink to the same component, the same `<script setup>` runs on the client instead. Confirm both paths work correctly — server-rendered first paint and client-side SPA transitions — and that Pinia state bridges properly between them.

### Tailwind

Migrated from `@nuxtjs/tailwindcss` (TW3 legacy wrapper, maintenance mode) to `@tailwindcss/vite` (TW4 direct Vite plugin). Nuxt UI v3 took the same path — it requires TW4 and explicitly conflicts with `@nuxtjs/tailwindcss`. If we shop for a component library, Nuxt UI v3 fits our stack.

### Vidstack

Vue component library for media playback. Installed as `vidstack@next`, not through a Nuxt module.

No Nuxt-specific integration means no Nuxt-specific migration concerns. It's a Vue 3 component; Nuxt 4 still uses Vue 3. The only Nuxt-relevant pattern is `<ClientOnly>` wrapping for SSR, which works identically in Nuxt 4.

Sources: [Vidstack docs](https://www.vidstack.io/docs/player/getting-started/installation/vue)

## [7] Migration: pnpm

### Peer Dependencies

Yarn Classic doesn't auto-install peer deps and fails silently. pnpm auto-installs them by default (`auto-install-peers=true`).

This is why `pino-pretty` is in site/package.json — yarn forced us to discover and add it manually:
```
@wagmi/connectors → @walletconnect/* → pino → pino-pretty (peer dep)
```

After migration, `pino-pretty` can be removed — pnpm handles it automatically.

**Gotcha:** Auto-installed peers are accessible to the package that declared them, but not always to your own code directly. If you try to `import` a peer dep that pnpm auto-installed (rather than one you declared), it might fail because pnpm doesn't hoist it to where your code can see it. This usually isn't a problem — you shouldn't be importing packages you don't declare — but it can cause confusion if you're used to yarn's more permissive hoisting.

We anticipated needing an `.npmrc` with `strict-peer-dependencies=false` to avoid peer conflict errors in our complex walletconnect tree. Turned out pnpm already defaults to `false` — it warns on peer conflicts but doesn't error. No `.npmrc` was needed.

### What to Watch

**Hoisting strictness** — pnpm won't let code access undeclared transitive deps. Audited: all imports in the site workspace are either declared in `site/package.json` or use valid subpath exports from declared packages. No undeclared transitive imports found.

**h3 / ofetch in icarus** — These are intentionally declared even though nuxt brings them, because Lambda code (which doesn't have Nuxt) uses them directly. Keep these.

### Dependency Cleanup After Migration

Before removing a dependency, ask "why is it here?" not "can we delete it?" Check package.md for origin notes, `pnpm why` for the dependency graph, and the code for actual imports. A package with no imports can still be load-bearing (peer deps, driver systems, plugin registrations).

**`pino-pretty`** — Done, removed in Chapter 1. Was a yarn classic workaround — walletconnect wanted pino, yarn couldn't resolve peer deps automatically, so we added pino-pretty. pnpm handles this natively. Not in the scaffold.

**`@unhead/vue`** — Probably keep. Origin: `nuxi module add og-image` injected it into package.json (see package.md). The fresh scaffold inherited this. `pnpm why` shows nuxt-og-image lists it as a **peer** dep — pnpm's strict resolution likely requires our explicit declaration to satisfy it, even though nuxt also brings it transitively.

**`unstorage`** — Probably keep. Origin: also injected by `nuxi module add og-image` (see package.md). Also in the fresh scaffold. Our og-image config uses unstorage's driver system (`cloudflare-kv-binding` for KV cache). WalletConnect also brings it transitively, but og-image's caching layer likely needs it resolvable at the site level.

## [8] Execution

### Remaining from this plan

- ☐ Review senseEnvironment() — verify `isLocal()`/`isCloud()` correct across all contexts after `import.meta.*` change
- ☐ Merge to main — `git switch main && git merge migrate1 && git branch -D migrate1 && git push`

### Undo Button

```bash
# Start an experiment (migrate1, migrate2, etc.) see what branch you're on with $ git branch
git switch -c migrate1

# Switch between branches (always commit first)
git switch main                     # go to main
git switch migrate1                 # go to experiment

# Compare branches
git diff main..migrate1             # file differences

# If it works — merge into main, delete branch
git switch main
git merge migrate1
git branch -D migrate1

# If it doesn't work — abandon, delete branch
git switch main
git branch -D migrate1
```

**Note:** node_modules is not tracked by git. When switching branches, reinstall if dependencies differ (`yarn install` on main, `pnpm install` on experiment).

**GitHub:** Keep experiment branches local. `git switch -c migrate1` doesn't touch GitHub. If experiment succeeds, merge to main and `git push` — commits reach GitHub, branch name never does. If experiment fails, delete locally, nothing to clean up remotely.

### Completed Steps

Migrated from Yarn Classic to pnpm (branch `migrate1`). Updated sem.js to read pnpm lockfile. Then scaffolded fresh Nuxt 4 project and began migration — see trail notes chapters below.

### Remaining Tests

The original 12-step plan's first three items turned out to be wrong: fresh1 didn't prove og-image worked (it 500'd on Workers — Chapter 5), we skipped compatibility mode and went straight to Nuxt 4, and h3 v2 testing was premature (Nuxt 4 still uses h3 v1 — Chapter 4). Items 6–9 and 11 are done. Three remain:

- ☐ Test error handling — throw in component, verify Datadog logging and error.vue display
- ☐ Test environment detection — log `senseEnvironment()` in all contexts, verify `isLocal()`/`isCloud()` correct
- ☐ Test `nuxi analyze` — verify size reports still generate (client.html, nitro.html)

---

## Trail Notes

### Chapter 1: Fresh2 Survey

**The method:** Scaffolded a fresh Nuxt 4 project on Cloudflare Workers (fresh1 as permanent reference, fresh2 as working copy). Reviewed every file in fresh2 against site, deleted each as addressed. When fresh2 was empty, we'd covered everything.

**The finding:** Substantive changes were minimal:

| File | Change |
|------|--------|
| package.json | nuxt 3→4, version bumps, removed nuxi/pino-pretty |
| nuxt.config.js | `compatibilityDate` bumped to `'2025-07-15'` |
| wrangler.jsonc | `compatibility_date` bumped to `'2025-09-27'` |
| tsconfig.json | Single `extends` → Nuxt 4 project references (app/server/shared/node) |
| public/robots.txt | Added (default "allow all") |

Scripts (`nuxt dev`, `nuxt build`, etc.) are unchanged between Nuxt 3 and 4 — no script modifications needed. Compatibility dates are independent systems (nuxt.config = Nuxt/Nitro framework behavior, wrangler.jsonc = Cloudflare Workers runtime) and don't need to match.

**Scaffold trap — h3 v2 in devDependencies:** The fresh scaffold included `"h3": "2.0.1-rc.11"` in devDependencies. We copied it, trusting the scaffold. But Nuxt 4.3.0 / Nitro 2.13.1 still runs h3 v1 — the scaffold's h3 v2 became top-level resolution, shadowed Nitro's v1, and broke nuxt-og-image (see Chapter 4). **If re-scaffolding in the future:** don't blindly copy devDeps that pin prerelease versions of framework internals. Check what Nitro actually resolves with `pnpm why h3 -r`.

**Notes for future:**
- `main` and `assets` are commented out in wrangler.jsonc because Nitro overrides them at build time. If a future Nitro version stops overriding, deployment will fail with "can't find entry point" — uncommenting is the first fix to try.
- Scaffold includes `<NuxtRouteAnnouncer />` for a11y (announces route changes to screen readers). Not added yet — consider for accessibility pass.

### Chapter 2: Code Changes for Nuxt 4

**Directory restructure:** Created `site/app/` and moved application code into it (`app.vue`, `error.vue`, plus `assets`, `components`, `composables`, `layouts`, `pages`, `plugins`, `stores`). Stays at site root: `server`, `public`, `nuxt.config.js`, `tsconfig.json`, `wrangler.jsonc`, `package.json`.

**import.meta.client/server:** Nuxt 4 deprecates runtime `process.client`/`process.server` in favor of compile-time `import.meta.client`/`import.meta.server` (Vite replaces with `true`/`false` at build). Updated `senseEnvironment()` in icarus/level2.js. In non-Vite environments (Lambda, plain Node), `import.meta.client` is `undefined` (falsy), so behavior is identical.

This chapter also included an h3 v1 → v2 migration and a tailwind.config.js change, both later superseded — see Chapter 4 (h3 revert) and tailwind.md (v4 migration eliminated the config file).

### Chapter 3: Version Cleanup

**The goal beyond Nuxt 4:** Return to a healthy, upgradeable stack where `upgrade-wash && install` works without breaking things — a stack that rides semver ranges forward, rather than a stale one where things only work by following arcane versions baked into an old lockfile.

Bumped 12 packages flagged 🏺 in sem.yaml (declared release 1+ year behind installed) to `^<installed>`: fast-glob, supabase-js, credit-card-type, libphonenumber-js, ofetch, client-ses, client-sns, twilio, fs-extra, serverless, sveltejs/kit, svelte. Mechanical gap-closing — no behavior change, no new versions pulled.

### Chapter 4: The h3 v2 False Start

First site build failed: `"sendError" is not exported by h3@2.0.1-rc.11`. nuxt-og-image's satori renderer imports `sendError`, which h3 v2 removed.

**The wrong assumption:** We assumed Nuxt 4 = h3 v2. It doesn't. Nuxt 4.3.0 / Nitro 2.13.1 still runs h3 v1. h3 v2 / Nitro v3 is scoped to Nuxt 5. The fresh scaffold included `"h3": "2.0.1-rc.11"` in devDependencies, and since it didn't have nuxt-og-image, the conflict never surfaced there. We copied it, pnpm resolved it as top-level, and it shadowed Nitro's v1 for every transitive dep.

**Fix:** Removed h3 v2, let Nitro provide h3 v1. Abstracted all h3 access in `icarus/level2.js` behind four `getWorker*` one-liners (`getWorkerQuery`, `getWorkerHeaders`, `getWorkerMethod`, `getWorkerBody`) so a future h3 v2 migration is a four-function change.

### Chapter 5: Builds Pass, Production Breaks

All three workspaces (oauth, net23, site) built clean, passed tests, and worked in local dev. Deployed to production — everything passed smoke tests except og-image, which 500'd on Cloudflare Workers:

```
CompileError: WebAssembly.instantiate(): Wasm code generation disallowed by embedder
```

Three possible causes: (1) compatibility_date bump, (2) Nitro version change in WASM bundling for cloudflare-module, (3) nuxt-og-image minor version. Rolled compatibility_date back from `2025-09-27` to `2025-06-10` and deployed — still broken. This ruled out Cloudflare runtime policy, pointing to Nitro 2.13.1's WASM bundling as the cause.

The lesson: WASM on Workers is invisible in local dev. The only way to catch this is deploying. nuxt-og-image v5 has no fix planned — the WASM fixes are v6 only (see og.md for the full picture).

### Chapter 6: The Dependency Chain

This was the decision point. og-image v6 requires Tailwind v4 — `nuxt prepare` crashed with `Cannot resolve module "tailwindcss"` when we tried v6 on our Tailwind v3 setup. The full dependency chain:

- og-image v5 → WASM broken on Workers with Nitro 2.13.1 (no fix planned for v5)
- og-image v6 beta → requires Tailwind v4
- Tailwind v4 → config rewrite, CSS restructure, forms plugin migration

"Switch to Nuxt 4" actually meant three stacked migrations. We chose to go forward rather than wait. Tailwind v4 went first (see tailwind.md), then og-image v6 (see og.md). Both completed successfully on branch `migrate1`.
