
# Migration Strategy and Notes

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

### nitro-cloudflare-dev

**What it does:** When `nuxt dev` runs, Cloudflare bindings (KV, R2, D1) don't exist in Node. This module spins up a local miniflare instance and injects emulated bindings into the request context so server routes work locally like production.

**Current state:** Module is in nuxt.config.js and package.json. Site also has two other Node compatibility layers: `nitro.cloudflare.nodeCompat: true` (build-time polyfills) and `compatibility_flags: ["nodejs_compat"]` in wrangler.jsonc (runtime polyfills).

**The module is officially deprecated.** The [README](https://github.com/nitrojs/nitro-cloudflare-dev) says "no longer required for the latest versions of Nitro" and points to [Nitro's native dev emulation](https://nitro.build/deploy/providers/cloudflare). Nitro ≥2.12 has this built in — we're on 2.13.1. The fresh scaffold still includes it (Cloudflare's CLI being conservative).

**Why this matters for og-image caching:** The og-image cache uses `cloudflare-kv-binding` as its storage driver, pointing at the `OG_IMAGE_CACHE` KV namespace from wrangler.jsonc. In production, the Workers runtime provides this binding directly — the module is not involved. In local dev, the KV namespace doesn't exist in Node, so something must emulate it. Currently that's this module (miniflare). If we remove it, Nitro's native emulation must provide the same binding, or og-image's storage driver has nothing to connect to — it may error or silently skip caching and regenerate every request. Production is unaffected either way.

**☐ Test removal:**
1. Comment out `configuration.modules.push('nitro-cloudflare-dev')` in nuxt.config.js
2. Run `nuxt dev` — look for `"ℹ Using cloudflare-dev emulation in development mode."` in console
3. Test that og-image generates locally (hit the `/_og/d/` endpoint) — this exercises the KV binding
4. If it works: `pnpm remove nitro-cloudflare-dev`
5. If not: uncomment and keep

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

### Other Dependencies

The site workspace has dependencies that aren't part of the fresh scaffold (they're not installed by `nuxi module add`). These need testing after Nuxt 4 upgrade but are outside the scaffold comparison:

**`@tanstack/vue-query`** — Async state management. Note says "peer dep of wagmi, also used directly" but both claims are unverified here — see Dependency Cleanup section for updated research.

**`@tailwindcss/forms`** — Tailwind plugin for form normalization. Note says "works with any Tailwind version" but we migrated to Tailwind v4 where it loads via `@plugin "@tailwindcss/forms"` in style.css — investigate whether the claim still holds.

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

**`@tanstack/vue-query`** — ☐ Test removing. NOT from scaffold — ours. Original package.md note (Nuxt 3 era) said "peer dependency of wagmi vue." But we use `@wagmi/core` and `@wagmi/connectors` directly, not a wagmi Vue wrapper. `pnpm why` shows zero transitive dependents. Not imported anywhere in site/app or icarus. Likely added anticipating wagmi Vue query hooks we never used. Dead weight.

## [8] Execution

### Remaining from this plan

1. ☐ Test nitro-cloudflare-dev removal — verify native Cloudflare emulation works (module still in nuxt.config.js)
2. ☐ Review senseEnvironment() — verify `isLocal()`/`isCloud()` correct across all contexts after `import.meta.*` change
3. ☐ Merge to main — `git switch main && git merge migrate1 && git branch -D migrate1 && git push`

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

The original 12-step plan's first three items turned out to be wrong: fresh1 didn't prove og-image worked (it 500'd on Workers — Chapter 5), we skipped compatibility mode and went straight to Nuxt 4, and h3 v2 testing was premature (Nuxt 4 still uses h3 v1 — Chapter 4). Items 6–9 and 11 are done. Four remain:

1. ☐ Test error handling — throw in component, verify Datadog logging and error.vue display
2. ☐ Test environment detection — log `senseEnvironment()` in all contexts, verify `isLocal()`/`isCloud()` correct
3. ☐ Test nitro-cloudflare-dev removal — verify native Cloudflare emulation works
4. ☐ Test `nuxi analyze` — verify size reports still generate (client.html, nitro.html)

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
