
# Migration Strategy and Notes

## [1] Strategy and Trade-offs

Three strategic decisions, each with three options:

### Approach

**A. Update in place, fresh scaffold as reference** — Scaffold fresh1 with current CLIs (Nuxt 4, pnpm, Cloudflare). Compare its configs against site's current state. Update site to match.
- *For:* Keep git history, deployment pipeline, wrangler bindings. Surgical diffs.
- *Against:* If something breaks mid-update, you're debugging in your working codebase.

**B. Replatform into fresh scaffold** — Get fresh1 fully deployed to Cloudflare first. Then incrementally port code: hello-world, stores, components, full site.
- *For:* Always have a working state. Clean isolation of platform vs code issues.
- *Against:* Recreate all deployment config. Infrastructure work before application code.

**C. Incremental upgrades (traditional)** — Follow Nuxt's official migration path: compatibility mode, codemods, test, upgrade package.
- *For:* Documented path with community support. Small testable steps.
- *Against:* Guides don't know Cloudflare. Can stretch into weeks. Codemods may leave vestiges.

### Timing

Nuxt ships a new major version every summer.

**Too early** (fall) — Ecosystem hasn't caught up. Modules have bugs, edge cases unfound. You're debugging framework issues instead of building product.

**Just right** (midwinter) — Six months of production use. Major bugs fixed, modules proven, runway before the next cycle.

**Too late** (spring/summer) — Old version enters trailing pain. Dependencies require the new version, security patches slow, can't update within semver ranges. Stuck on a dying branch.

*Current status:* We've entered the early edge of "too late." Some dependencies can no longer update within their declared semver ranges on Nuxt 3. The window is closing.

### Sequencing

**pnpm first, then Nuxt 4** — Swap package manager on working Nuxt 3 codebase. pnpm is mechanical—same dependencies, stricter resolution. If something breaks, it's pnpm's hoisting rules, isolated. Then Nuxt 4 comparisons against fresh1 are direct (both pnpm).

**Nuxt 4 first, then pnpm** — Upgrade the framework with yarn. If something breaks, it's Nuxt 4. But fresh1 uses pnpm, so comparisons aren't apples-to-apples until the final step.

**Both simultaneously** — One big migration. Faster if it works. If something breaks, harder to isolate whether it's pnpm or Nuxt 4.

## [2] Tool: Fresh

Modern full-stack JavaScript has several top-level dependencies the team is responsible for: cloud provider, package manager, web framework, their associated tooling, and framework modules. These compete for authority—Nuxt, Cloudflare's CLI, and pnpm each assume they're the starting point and everything else will follow their conventions. Each releases major versions, and their ecosystems of modules follow. When Nuxt 4 ships, Pinia updates, Tailwind updates, Wrangler updates its integration with Nuxt—and each brings its own dependency tree and peer dependency requirements.

This creates a difficult reality where a team must deal with ecosystem migrations more than once a year. Upgrading in place is treacherous: you change one thing, peer dependencies conflict, you chase errors through a maze of transitive dependencies, and you're never sure if a problem is your code, your config, or dependency hell.

So, an alternative. Here, we can quickly scaffold fresh. Spin up a new project with today's CLI tools, see what versions and configs you get out of the box, and compare that to your current setup. Diffs tell you exactly what's changed. You can then port your code into the fresh scaffold, or selectively update your existing project with confidence about what the "known good" state today looks like.

```
  steps to quickly scaffold the cloudflare nuxt stack and modules, 2026feb3
  these are designed to be easy to paste in one line at a time rather than typing or this being a script
  start in ~/Documents/code/temp

rm -rf fresh1
pnpm create cloudflare@latest
  type name fresh1, framework starter, nuxt, no official modules, no git, no deploy)
cd fresh1
git init
git add . && git commit -m "1nuxt"

pnpm dlx nuxi@latest module add pinia
git diff > 2pinia.diff && git add . && git commit -m "2pinia"

pnpm dlx nuxi@latest module add og-image
git diff > 3ogimage.diff && git add . && git commit -m "3ogimage"

pnpm dlx nuxi@latest module add tailwindcss
pnpm why tailwindcss > 4tailwind.txt
git diff > 4tailwind.diff && git add . && git commit -m "4tailwind"

pnpm add vidstack@next
git diff > 5vidstack.diff && git add . && git commit -m "5vidstack"

rm -rf .git .nuxt .output .vscode .wrangler node_modules
cd ../..
rm -rf cold3/fresh1
mv temp/fresh1 cold3/fresh1

  fresh1 will be an inert folder in the monorepo, alongside named workspace folders
  and you and claude can examine
  you can also $ cp -r fresh1 fresh2 to boil down fresh2 as you update or decline granular differences
```

## [3] Tool: sem.js and sem.yaml

In a monorepo, the same package may appear multiple times at different versions. There are four distinct version concepts:

**Four versions of every package:**

| Version | What it is | How to find it |
|---------|------------|----------------|
| **Declared** | The semver range in package.json | Read package.json |
| **Installed** | What's actually in node_modules/lockfile | `yarn why <pkg>` or `pnpm why <pkg>` |
| **Current** | Latest within your semver range | `npm view <pkg>@"<range>" version \| tail -1` |
| **Latest** | Absolute newest on npm | `npm view <pkg> version` |

**Automated analysis:**

Run `node sem.js` to generate `sem.yaml` with complete version analysis across all workspaces. The output includes:
- All four versions for every dependency
- Flags for: installed 1+ year old, current 6+ months newer, major version available
- Download counts grouped by magnitude
- Publication dates

The script parses pnpm-lock.yaml (valid YAML, simpler than the old yarn.lock parsing) and fetches live data from the npm registry.

## [4] Migration: Nuxt 4

Nuxt's official upgrade path is incremental: enable compatibility mode, run codemods, then upgrade. This section documents those tools as reference — they may be useful, but they're not necessarily our plan.

The fresh scaffolding approach is different: start from a known-good Nuxt 4 + Cloudflare scaffold and port code into it, or use it as reference for rapid updates. Nuxt's codemods don't know about Cloudflare, so they may preserve vestiges that a fresh `pnpm create cloudflare@latest` wouldn't have.

### Compatibility Mode

Before actually upgrading, you can opt-in to v4 behavior while staying on your current Nuxt 3 version:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4
  }
})
```

When you set your `compatibilityVersion` to 4, defaults throughout your Nuxt configuration will change to opt in to Nuxt v4 behavior, but you can granularly re-enable Nuxt v3 behavior when testing.

### Codemods

The Nuxt team collaborated with the Codemod team to automate many migration steps.

```bash
npx codemod@latest nuxt/4/migration-recipe
```

The recipe includes these individual codemods:
- `nuxt/4/file-structure` — moves files into the new `app/` directory
- `nuxt/4/shallow-data-reactivity` — updates `useFetch`/`useAsyncData` for shallow reactivity
- `nuxt/4/default-data-error-value` — handles new error/data default behavior
- `nuxt/4/deprecated-dedupe-value` — fixes deprecated dedupe values
- `nuxt/4/absolute-watch-paths` — updates `builder:watch` hook paths

When prompted, you can toggle which codemods to apply—useful if you want to handle some changes manually.

### Package Upgrade

```bash
npx nuxi upgrade
```

Or manually update `package.json` to `nuxt@^4.0.0` and reinstall.

### Directory Structure

```
my-app/
├─ app/              # NEW: application code goes here
│  ├─ components/
│  ├─ composables/
│  ├─ pages/
│  ├─ plugins/
│  └─ app.vue
├─ server/           # stays at root
├─ public/           # stays at root
└─ nuxt.config.ts
```

Migration is not required. If you wish to keep your current folder structure, Nuxt should auto-detect it. You can also explicitly opt out:

```ts
export default defineNuxtConfig({
  srcDir: '.',
  dir: { app: 'app' }
})
```

**Decision:** We're adopting the new `app/` directory structure. This aligns with fresh scaffolds and Nuxt's forward direction. The codemod `nuxt/4/file-structure` can move files automatically, or we can do it manually.

### Data Fetching

Nuxt 4 changes `useFetch` and `useAsyncData` to use shallow reactivity by default. Nested mutations like `data.value.user.profile.name = 'Bob'` won't trigger UI updates.

**This codebase is not affected.** It uses `$fetch` with Pinia stores instead of `useFetch`/`useAsyncData`. From `plugins/hello.txt`:

> "$fetch + pinia loaded flag pattern = useFetch's double-fetch prevention, but with state living in your store where it belongs. adding useFetch on top of pinia would create two competing state systems."

The Pinia stores use `ref()` (deep reactive by default), and state changes go through store actions that replace values rather than mutate nested properties. No changes needed.

### TypeScript

Nuxt 4 creates separate TS projects for app/server/shared contexts. Imports that worked before may show errors if they cross context boundaries (e.g., importing a server util into a component). The fix is moving shared code to `shared/` or fixing the import.

### Notes

- Codemods won't move custom directories like `locales/` — handle those manually if using the codemod approach
- If using Nuxt layers, each layer may need its own `compatibilityVersion` setting
- Cloudflare Workers deployment uses the same build output structure

### Error Handling

This codebase has a specific error handling philosophy that interacts with Nuxt's error system. Changes here could silently break error reporting or surface new failure modes.

**Philosophy (from net23.txt):**

The approach is "fail fast" — exceptions are exceptional, not control flow:

1. **Two try/catch levels only:**
   - **Tight**: Around third-party API calls (Twilio, MetaMask, Alchemy) — catch locally, work around or retry
   - **Broad**: Global handlers at framework level — log to Datadog, show error.vue, interrupt user

2. **Never catch in between.** If you're writing try/catch for control flow in your own code, you're doing it wrong. Toss exceptions immediately, let them bubble up to global handlers. This surfaces bugs quickly rather than masking them.

3. **Cause/remedy thinking:**
   - Staff fault → deploy fix (this is a bug)
   - Critical provider fault (Cloudflare, Supabase) → they wake up on-call, fix it
   - Redundant provider fault (Twilio, SES) → round-robin to backup automatically
   - User fault → UX guidance, or block if attacking

4. **Trust zones:** page script (least trusted, assume malicious extensions) → browser → worker (trusted)

**Current Implementation:**

`plugins/errorPlugin.js` hooks into Nuxt's error system:

```js
nuxtApp.hook('app:error', async (error) => { ... })  // SSR, plugin init, first hydration
nuxtApp.hook('vue:error', async (error, instance, info) => { ... })  // render, lifecycle, setup
```

- Server-side: logs to Datadog via `awaitLogAlert()`, returns nothing (Nuxt renders error.vue)
- Client-side: saves details to `pageStore.errorDetails`, calls `showError()` to trigger error.vue
- `error.vue` is deliberately minimal — no error details exposed, just "Reload Site" and link to error2

**Nuxt 4 Migration Concerns:**

1. **`process.server`/`process.client`** — The plugin uses these; Nuxt 4 deprecates them for `import.meta.server`/`import.meta.client`. Already noted as a ttd in the code.

2. **Hook signatures** — Verify `app:error` and `vue:error` hooks still exist with same signatures in Nuxt 4.

3. **`showError`/`createError` APIs** — These are Nuxt utils. Check if signatures changed.

4. **`error.vue` location** — With the `app/` directory structure, this may need to move to `app/error.vue`. The codemod should handle this, but verify.

5. **Plugin execution order** — The error plugin accesses `usePageStore()`. If Nuxt 4 changes when plugins run relative to Pinia initialization, this could fail.

**Testing approach:** After enabling compatibility mode, deliberately throw an exception in a component and verify: (a) it logs server-side, (b) client shows error.vue, (c) pageStore has the details.

### Environment Detection (Sticker)

The codebase includes a fuzzy environment detection system in `icarus/level2.js` that determines where code is running without being explicitly told. This is used throughout for conditional behavior.

**How it works:**

`senseEnvironment()` probes for globals and builds a tag list:

```js
if (type(typeof process)) {                  a.push('Proc')
  if (text(process?.versions?.v8))           a.push('Eigh')  // V8 engine
  if (text(process?.versions?.node))         a.push('Node')
  if (text(process?.env?.AWS_EXECUTION_ENV)) a.push('Lamb')  // Lambda
  if (process?.client)                       a.push('Clie')  // Nuxt client
  if (process?.server)                       a.push('Serv')  // Nuxt server
}
if (type(typeof $fetch))                     a.push('Fetc')  // Nuxt's fetch
// ... plus window, document, self, localStorage, navigator, location, etc.
```

Then matches against a pattern table to determine environment:

```
LocalVite, LocalNode, LocalLambda, CloudLambda
LocalNuxtServer, CloudNuxtServer
LocalPageServer, CloudPageServer
LocalPageClient, CloudPageClient
```

**What depends on this:**

`isLocal()` and `isCloud()` are used throughout for:

| Usage | Location | Purpose |
|-------|----------|---------|
| Cookie secure flag | `level2.js:374` | `secure: isCloud()` |
| Cookie name prefix | `level2.js:353` | `__Host-` prefix only in cloud |
| Origin URLs | `level2.js:619-620` | localhost:3000 vs deployed domain |
| Security checks | `level2.js:995,1023` | Skip HTTPS/origin checks locally |
| Datadog logging | `level2.js:1371` | Only send to Datadog from cloud |
| Turnstile verification | `level2.js:1450` | Skip locally (needs real IPs) |

`Sticker()` generates debug strings like `"LocalVite.2025jun26.PKM3EYY.Fri10:21a..."` used in:
- Error plugin logging
- API response debugging
- Test result summaries

**Nuxt 4 Migration Concerns:**

1. **`process.client`/`process.server` deprecated** — The detection uses these at lines 119-120. Nuxt 4 deprecates them for `import.meta.client`/`import.meta.server`, but `import.meta.*` can't be checked dynamically the same way (`typeof import.meta.client` won't work).

2. **Fuzzy matching sensitivity** — If Nuxt 4 changes what globals are available (e.g., different polyfills, different bundler behavior), the pattern matching could misidentify the environment. The version number `_senseEnvironmentVersion = 3` exists for this reason.

3. **Pattern table may need updates** — New rows may be needed if Nuxt 4 environments have different signatures. After migration, run `senseEnvironment()` in each context and compare the `found` tags against expected patterns.

**Testing approach:** After enabling compatibility mode or upgrading:
1. Log `senseEnvironment()` output in each context (local dev server, local page client, deployed server, deployed client)
2. Verify `isLocal()`/`isCloud()` return expected values
3. Check that cookies, origins, and security checks behave correctly
4. If patterns drift, update the `_senseEnvironment` table and increment `_senseEnvironmentVersion`

### Configuration Files

Two config files need updates: `nuxt.config.js` and `wrangler.jsonc`. Both have a compatibility date that should be bumped to match fresh1.

**nuxt.config.js:**

| Setting | site (current) | fresh1 (target) | Action |
|---------|----------------|-----------------|--------|
| `compatibilityDate` | `'2025-06-10'` | `'2025-07-15'` | Bump |

Site's nuxt.config has additional settings not in fresh1 (build.analyze, esbuild BigInt fix, components.dirs, tailwindcss.cssPath, Google Fonts, ogImage KV cache, vidstack plugin). These are site-specific additions, not conflicts — keep them all.

**wrangler.jsonc:**

| Setting | site (current) | fresh1 (target) | Action |
|---------|----------------|-----------------|--------|
| `compatibility_date` | `"2025-06-10"` | `"2025-09-27"` | Bump |
| `main`, `assets` | omitted | present | Keep omitting (Nitro overrides) |
| `nodejs_compat` flag | present | absent | Keep for now, test removal later |
| `placement: smart` | enabled | commented out | Keep enabled |
| `kv_namespaces` | OG_IMAGE_CACHE | absent | Keep (site-specific) |

**nodejs_compat question:** Site has both `"compatibility_flags": ["nodejs_compat"]` in wrangler.jsonc AND `nitro.cloudflare.nodeCompat: true` in nuxt.config. Fresh1 only has the latter. The nuxt.config setting is build-time polyfills; the wrangler setting is runtime. Probably keep both for safety, test removal in Phase 3.

**main/assets question:** Fresh1's scaffold includes `"main": "./.output/server/index.mjs"` and `"assets": {...}`, but site omits them. Nitro overrides these at build time and warns if you set them manually. Site learned to omit them to avoid the warning. However, if Nuxt 4/Nitro's behavior changed, we might need to add them back. If deployment fails with "can't find entry point" or similar, check whether `main` needs to be explicitly set.

## [5] Migration: Modules

### nitro-cloudflare-dev

When you run `nuxt dev`, Nitro spins up a local Node.js server. But Cloudflare Workers have their own runtime with bindings (KV, R2, D1, etc.) that don't exist in Node. Your code that accesses `event.context.cloudflare.env.OG_IMAGE_CACHE` would fail locally because that KV namespace doesn't exist in Node.

This module enables access to the Cloudflare runtime platform in the development server of Nitro and Nuxt using the `getPlatformProxy` API exposed by wrangler and miniflare.

It reads your `wrangler.jsonc`, spins up a local miniflare instance, and injects the emulated bindings into your request context so your server routes work locally the same way they do in production.

**Three layers of Node compatibility:**

| Layer | Where | What it does |
|-------|-------|--------------|
| Build-time polyfills | `nitro.cloudflare.nodeCompat: true` in nuxt.config | Bundles shims for Node APIs (fs, path, crypto) into the Worker at build time |
| Runtime polyfills | `compatibility_flags: ["nodejs_compat"]` in wrangler.jsonc | Cloudflare's Workers runtime provides Node API compatibility as a platform feature |
| Dev emulation | `nitro-cloudflare-dev` module | Spins up miniflare locally so KV/R2/D1 bindings work during `nuxt dev` |

Site has all three. Fresh scaffold only has build-time polyfills (nodeCompat) and dev emulation (the module). We added the runtime flag ourselves — it might be redundant, or it might be a useful fallback. Keep for now.

**Why it may not be needed anymore:**

Nitro 2.12+ has dev emulation built in natively. When it's working, you should see:

```
ℹ Using cloudflare-dev emulation in development mode.
```

**Fresh1 status:** The `pnpm create cloudflare@latest` scaffold still includes `nitro-cloudflare-dev` in the generated config and package.json. This may be Cloudflare's CLI being conservative, or it may still be needed for certain features.

**⚠️ TODO: Test removal in Phase 3**

After migration is working, try removing this module:

1. Comment out the module in nuxt.config:
   ```js
   // configuration.modules.push('nitro-cloudflare-dev')  // comment out
   ```
2. Run `nuxt dev`
3. Look for the "Using cloudflare-dev emulation" message in console
4. Test that KV binding still works — hit `/__og-image__/image/og.png` locally, verify it generates
5. If it works, uninstall the package:
   ```bash
   pnpm remove nitro-cloudflare-dev
   ```
6. If it doesn't work (no emulation message, KV errors), uncomment and keep the module

Prerequisite: `compatibilityDate` must be recent and preset must be explicit. Site has both:

```js
configuration.compatibilityDate = '2025-07-15'
configuration.nitro = { preset: 'cloudflare_module', ... }
```

### Pinia

`@pinia/nuxt` supports both Nuxt 3 and 4.

**Directory Structure:**

Stores are in `site/stores/`. If adopting Nuxt 4's `app/` directory structure, either move them to `app/stores/` or configure:

```ts
pinia: { storesDirs: ['./stores/**'] }
```

**Decision:** Move stores to `app/stores/` to keep all application code together. The codemod should handle this.

**Current SSR Pattern:**

The codebase uses a manual `loaded` flag to prevent double-fetching:

```js
// Every store that loads data on server
const loaded = ref(false)
async function load() {
  if (loaded.value) return  // Client-side call becomes no-op
  loaded.value = true
  // ... fetch data
}
```

In `app.vue`:
```js
const mainStore = useMainStore()
await mainStore.load()  // Blocks server render, sets loaded=true
// Client receives hydrated state, load() is no-op
```

This pattern works. There's no hydration plugin because state flows through Vue's automatic Pinia serialization. The `loaded` guard prevents the client from re-fetching what the server already fetched.

**Risk:** The pattern is correct but requires discipline—every store that fetches during SSR must have the `loaded` guard. `pageStore` is intentionally client-only (UI state like notifications) and has no guard.

**Nuxt 4 concern:** If plugin execution order changes, stores accessed in `errorPlugin.js` (which runs universally) could behave differently. Current code handles this—`pageStore` is accessed but only populated client-side.

**No action needed** unless the migration surfaces hydration errors. If it does: add `app/plugins/01.pinia-hydration.ts` that calls `useNuxtApp().$pinia.state.value` to force early initialization.

Sources: [Pinia Nuxt docs](https://pinia.vuejs.org/ssr/nuxt.html)

### OG Image

Dynamic OG image generation for social cards. This module has required the most maintenance due to version instability and heavy dependencies designed for both serverless and traditional Node environments.

**Current Configuration:**

In `nuxt.config.js`:
```js
configuration.ogImage = {
  defaults: {
    cacheMaxAgeSeconds: 20*Time.minutesInSeconds  // 20 min, not default 3 days
  },
  runtimeCacheStorage: {
    driver: 'cloudflare-kv-binding',
    binding: 'OG_IMAGE_CACHE',
  },
}
```

In `wrangler.jsonc`:
```jsonc
"kv_namespaces": [
  {"binding": "OG_IMAGE_CACHE", "id": "ee95a879988944c2a7eb9521e62eb102"}
]
```

**Usage:** Uses built-in `NuxtSeo` component in two places:
- `site/pages/index.vue` — static home card
- `site/pages/card/[more].vue` — dynamic cards per route

No custom OG image components. First generation ~1500ms, cached requests much faster.

**Version History:**

Declared as `^5.1.6` in package.json, but lockfile resolves to `5.1.12`. The caret range allows up to 5.x.x, meaning a fresh install could pull 5.1.13 (which breaks).

| Date | Change | Reason |
|------|--------|--------|
| Mar 2025 | v3 → v5 | unenv compatibility error |
| Dec 2025 | Lockfile at 5.1.12 | v5.1.13 broke the build (satori 0.15 → 0.18) |

The lockfile currently protects against this. True defensive pinning would require `"nuxt-og-image": "5.1.12"` (no caret). Moving to Nuxt 4 with fresh scaffold should sidestep this — whatever version the scaffold pulls is proven against Nuxt 4.

**Heavy Transitive Dependencies:**

| Dependency | Purpose |
|------------|---------|
| `playwright-core` (3MB+) | Browser automation (not used on Workers) |
| `satori` | HTML/CSS → SVG conversion |
| `@resvg/resvg-wasm` | SVG → PNG via WASM (used on Workers) |
| `yoga-wasm-web` | CSS layout engine for satori |
| `chrome-launcher` | Headless Chrome fallback |
| Inter font files (550KB each) | Embedded fonts for rendering |

On Cloudflare Workers, only the WASM path is used. But playwright-core still gets installed.

**Companion Dependencies:**

The `nuxi module add og-image` command added three packages to `site/package.json`:

- `nuxt-og-image` — the actual module, **keep**
- `@unhead/vue` — also brought in by nuxt itself, **possibly removable**
- `unstorage` — also brought in by nitropack/nuxt/walletconnect, **possibly removable**

**Cache Invalidation:**

When `defineOgImageComponent` properties change, old cached images persist until TTL expires (20 min). Force regeneration:
```
https://domain/__og-image__/image/og.png?purge
```

**Nuxt 4 Compatibility:**

nuxt-og-image is part of the [Nuxt SEO](https://nuxtseo.com/docs/og-image/getting-started/introduction) suite. No dedicated Nuxt 4 migration guide exists, but the module is actively maintained (issues being filed and resolved as of January 2026).

This codebase's usage is minimal: 2 pages, both using the built-in `NuxtSeo` template, no custom OG image components. The `defineOgImageComponent()` API is unchanged in Nuxt 4.

**WASM on Cloudflare Workers:**

The module has multiple rendering backends. On Cloudflare Workers, it uses the WASM path (satori → resvg-wasm). Known issues exist with WASM loading in various environments. The current config doesn't specify a compatibility mode, which means it auto-detects.

If WASM issues occur after migration, the module supports explicit compatibility settings:

```js
ogImage: {
  compatibility: {
    runtime: { resvg: 'wasm' }  // explicit, or try 'wasm-fs'
  }
}
```

However, setting `resvg: 'node'` won't work on Workers (no Node runtime). The WASM path is required.

**Migration approach:** The fresh scaffold pulls whatever version is current. If the scaffold's OG image generation works on Cloudflare, the version is proven. The current 5.1.12 vs 5.1.13 issue was Nuxt 3 specific—Nuxt 4's dependency tree may resolve differently.

**Fresh1 status:** The scaffold pulled 5.1.13 (the version that broke on Nuxt 3). This needs testing—if OG image generation works on fresh1 deployed to Cloudflare, that version is proven for Nuxt 4.

Sources: [Nuxt SEO docs](https://nuxtseo.com/docs/og-image/getting-started/installation), [Compatibility guide](https://nuxtseo.com/docs/og-image/guides/compatibility), [GitHub issues](https://github.com/nuxt-modules/og-image/issues)

### Tailwind

`@nuxtjs/tailwindcss` supports both Nuxt 3 and Nuxt 4.

The `site/tailwind.config.js` uses relative paths, which avoids the `@` alias issue (Nuxt 4 changes `@` to mean `app/` instead of root).

**However**, adopting the `app/` directory structure means content paths need updating:

```js
// Current
content: [
  './nuxt.config.{js,ts}',
  './app.vue',
  './components/**/*.{vue,js,ts}',
  // ...
]

// After app/ move
content: [
  './nuxt.config.{js,ts}',
  './app/app.vue',
  './app/components/**/*.{vue,js,ts}',
  // ...
]
```

This is a manual step after moving to the `app/` directory structure.

**Tailwind CSS v4** (January 2025) is a major rewrite with CSS-first configuration. The Nuxt module supports it. Alternative: use the Vite plugin directly:

```ts
export default defineNuxtConfig({
  vite: { plugins: [require('@tailwindcss/vite').default()] }
})
```

Sources: [Nuxt Tailwind docs](https://tailwindcss.nuxt.dev/)

### Vidstack

Vue component library for media playback. Installed as `vidstack@next`, not through a Nuxt module.

No Nuxt-specific integration means no Nuxt-specific migration concerns. It's a Vue 3 component; Nuxt 4 still uses Vue 3. The only Nuxt-relevant pattern is `<ClientOnly>` wrapping for SSR, which works identically in Nuxt 4.

Sources: [Vidstack docs](https://www.vidstack.io/docs/player/getting-started/installation/vue)

### h3

Nuxt 4 upgrades from h3 v1 to h3 v2. This is a breaking change for code that imports h3 utilities directly.

**This codebase uses h3 directly in two places:**

1. `icarus/level2.js` imports `getQuery`, `readBody`:
   ```js
   import {getQuery, readBody} from 'h3'
   // ...
   door.query = getQuery(workerEvent)
   door.body = await readBody(workerEvent)
   ```

2. `site/server/middleware/cookieMiddleware.js` uses `getCookie`, `setCookie`:
   ```js
   value = getCookie(workerEvent, composeCookieName())
   setCookie(workerEvent, composeCookieName(), composeCookieValue(browserTag), cookieOptions.browser)
   ```

**h3 v2 changes that may affect this code:**

- `readBody` now always returns the raw body. Use `readJSON` for parsed JSON, or `readValidatedBody` with a schema.
- `getQuery` renamed to `getURLQuery`. The old name may still work but is deprecated.
- Cookie functions may have signature changes.
- Event object structure changed—`event.node.req`/`event.node.res` replaced with `event.request`/`event.response`.

**Fresh1 status:** The scaffold explicitly adds `h3: "2.0.1-rc.11"` to devDependencies. This confirms Nuxt 4 uses h3 v2.

**Migration approach:** After enabling compatibility mode or upgrading to Nuxt 4, test server routes that use these functions. If they fail, update imports and function calls per h3 v2 API.

Sources: [h3 v2 migration](https://h3.unjs.io/guide/migration)

### Other Dependencies

The site workspace has dependencies that aren't part of the fresh scaffold (they're not installed by `nuxi module add`). These need testing after Nuxt 4 upgrade but are outside the scaffold comparison:

| Package | Purpose | Migration concern |
|---------|---------|-------------------|
| `@wagmi/core`, `@wagmi/connectors`, `viem` | Web3 wallet connection | Vue 3 compatible, no Nuxt-specific integration |
| `@tanstack/vue-query` | Async state management | Peer dep of wagmi, also used directly |
| `@uppy/core`, `@uppy/dashboard`, `@uppy/aws-s3` | File uploads | Vue 3 compatible, client-only |
| `qrcode` | QR code generation | Pure JS, no framework deps |
| `@tailwindcss/forms` | Tailwind plugin | Works with any Tailwind version |
| `icarus` | Workspace shared code | Internal, moves with us |

These packages don't interact with Nuxt's internals—they're Vue components or pure utilities. Test after migration; no preemptive changes needed.


## [6] Migration: pnpm

Migrating from Yarn Classic (1.x) to pnpm. The fresh scaffolds already use pnpm, so this aligns the monorepo with the target state.

### Setup

Corepack manages package managers (yarn, pnpm) within Node. It reads the `packageManager` field in each project's `package.json` to decide which one to use.

**Already done** (documented in `net23/net23.txt`):
```bash
corepack enable
corepack prepare pnpm@latest --activate
# pnpm 10.28.2 installed via corepack, not homebrew or npm global
```

The only thing gating the switch is cold3's `package.json` having `"packageManager": "yarn@1.22.22"`. Change that field and corepack serves pnpm instead.

### What's Easy

- **Lockfile**: `pnpm import` converts yarn.lock to pnpm-lock.yaml
- **Workspaces**: pnpm reads the same `workspaces` field in package.json
- **Scripts**: All npm scripts work identically
- **packageManager field**: Change to `"packageManager": "pnpm@10.x.x"`
- **Workspace deps**: pnpm understands `"icarus": "*"` but prefers `"icarus": "workspace:*"`. Works either way.

### Peer Dependencies

Yarn Classic doesn't auto-install peer deps and fails silently. pnpm auto-installs them by default (`auto-install-peers=true`).

This is why `pino-pretty` is in site/package.json — yarn forced us to discover and add it manually:
```
@wagmi/connectors → @walletconnect/* → pino → pino-pretty (peer dep)
```

After migration, `pino-pretty` can be removed — pnpm handles it automatically.

**Gotcha:** Auto-installed peers are accessible to the package that declared them, but not always to your own code directly. If you try to `import` a peer dep that pnpm auto-installed (rather than one you declared), it might fail because pnpm doesn't hoist it to where your code can see it. This usually isn't a problem — you shouldn't be importing packages you don't declare — but it can cause confusion if you're used to yarn's more permissive hoisting.

**If peer conflicts block install**, create `.npmrc` at project root:
```ini
auto-install-peers=true
strict-peer-dependencies=false
```

Why `strict=false` for monorepos: complex dependency trees often have transitive peer dep conflicts that aren't actual problems. Warnings let you know; errors block your install.

| auto-install-peers | strict-peer-dependencies | Behavior |
|---|---|---|
| `true` | `true` | Auto-install peers, error on conflicts. **pnpm default.** |
| `true` | `false` | Auto-install peers, warn on conflicts. **Monorepo recommendation.** |

### What to Watch

**net23** — Stays isolated with plain npm for Lambda builds. The `build.js` script handles cross-compilation for Amazon Linux arm64. No pnpm interaction needed. Includes `sharp` (native module with platform-specific binaries), `@sendgrid/mail`, `twilio`, and `@aws-sdk/*` — npm handles the native compilation, pnpm never touches this workspace.

**Hoisting strictness** — pnpm won't let code access undeclared transitive deps. Audited: all imports in the site workspace are either declared in `site/package.json` or use valid subpath exports from declared packages. No undeclared transitive imports found.

**nuxt-og-image** — Complex dependency tree (satori, yoga-wasm, resvg-wasm). The WASM binaries need to load correctly under pnpm's stricter resolution. Known failure mode: `No loader is configured for '.wasm' files`. If this occurs:

1. Check that `pnpm-lock.yaml` resolved the same versions as `yarn.lock` for resvg-wasm
2. Try `pnpm rebuild` to regenerate native/wasm bindings
3. Verify the Cloudflare dev server shows OG images generating (hit `/__og-image__/image/og.png`)

The lockfile currently pins 5.1.12. After `pnpm import`, verify the resolved version hasn't drifted to 5.1.13 (which broke on Nuxt 3).

**h3 / ofetch in icarus** — These are intentionally declared even though nuxt brings them, because Lambda code (which doesn't have Nuxt) uses them directly. Keep these.

### Dependency Cleanup After Migration

| Package | Action | Reason |
|---------|--------|--------|
| `pino-pretty` | Remove | pnpm auto-installs peer deps |
| `@unhead/vue` | Test removing | nuxt brings it |
| `unstorage` | Test removing | nitropack/nuxt/walletconnect bring it |
| `@tanstack/vue-query` | Keep | peer dep of wagmi but also used directly in code |

## [7] Execution

### Methodology: All At Once

The "tear off the bandaid" approach. Rather than incremental testing with compatibility flags and one-change-at-a-time verification, make all changes first, then fix whatever breaks.

**Why this might work better:**

- Incremental approaches stretch over days/weeks, maintaining mental context is hard
- Compatibility mode and codemods don't know about Cloudflare, may leave vestiges
- We have fresh1 as a known-good reference — match it, don't invent our own path
- A working starting point means we can always abandon and return to main
- The codebase is small enough to hold in your head

**Phase 1: Checkpoint**

We're here. Code is tested, committed, working. Branch `migrate1` exists. We can always `git switch main` to return.

**Phase 2: Changes Everywhere**

Without running the code, apply all changes in sequence. Use fresh1 as the guide — match its versions, module roster, compatibility dates, config patterns. We're not deploying fresh1; we trust that Cloudflare's scaffold works and use it as the reference on the wall.

Order: outwards to inwards. Dependencies first, then configuration, then code.

| Order | Change | Guide |
|-------|--------|-------|
| 2a | Bump nuxt to ^4.x | fresh1/package.json |
| 2a | Bump all module versions to fresh1's versions | fresh1/package.json |
| 2a | Restore carets (except where fresh1 pins exactly) | fresh1/package.json |
| 2b | Update nuxt.config.js patterns | fresh1/nuxt.config.ts |
| 2b | Update compatibilityDate | fresh1/nuxt.config.ts |
| 2b | Remove nitro-cloudflare-dev | test if native works |
| 2c | Move to `app/` directory structure | fresh1 folder structure |
| 2c | Update tailwind.config.js content paths | manual, for app/ structure |
| 2d | Update `process.server`/`process.client` → `import.meta.*` | Nuxt 4 deprecation |
| 2d | Update h3 v2 API usage | h3 migration guide |
| 2d | Review senseEnvironment() for new patterns | manual testing later |

Commits during Phase 2: decide as we go. Maybe a few large checkpoints, maybe all at once.

At each step: review the diff, do a sanity check ("is this correct to run?"), but don't run yet. When phase 2 is complete:

- package.json files have fresh1-aligned versions with carets
- Directory structure matches Nuxt 4 convention
- Config files updated
- Deprecated modules removed
- Code updated for known API changes

**Phase 3: Fix-a-thon**

Now try to run it. Expect errors.

1. `pnpm install` — resolve any dependency conflicts
2. `pnpm build` — fix build errors one by one
3. `pnpm dev` — fix runtime errors
4. Run automated tests — fix failures
5. Manual smoke tests — check key flows (auth, OG images, Cloudflare bindings)
6. Deploy to Cloudflare — verify production works

Research and fix issues as they surface. This is where we discover what actually breaks vs. what we worried might break.

**Rollback Philosophy**

Fix forward only. Either we make it all the way to Nuxt 4 working, or we completely retreat to main (Nuxt 3) and try again in a few months. No partial rollbacks, no "keep this module on the old version." The hope is that og-image 5.1.13 broke on Nuxt 3 because they moved on to Nuxt 4 and stopped testing backwards — following fresh1's versions should put us in their tested path.

Note: fresh1 pins og-image to exactly `5.1.13` (no caret). We follow that.

**Phase 4: Cleanup**

Once working:

1. Verify all fresh1 guide points are reflected
2. Run `node sem.js` — confirm versions are current, carets restored
3. Remove yarn.lock and any yarn classic remnants
4. Review for leftover TODOs, stale comments, dead code
5. Final commit on migrate1
6. `git switch main && git merge migrate1 && git branch -D migrate1`
7. `git push`

---

### Methodology: Incremental (Alternative)

The step-by-step approach with testing at each stage. Enable compatibility mode first, test, then upgrade packages, test, then move directories, test. Documented in "Next Steps" below for reference, but we may use the All At Once approach instead.

---

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

```bash
gitlog

#017244c Feb03Tue XUV migration plan ready
#d9943a3 Feb03Tue AYO before first migration steps
#bb9dc01 Feb04Wed SGO yarn wash to prove you can get back here

yarn wash #cleared node modules insalled by yarn classic, does not delete yarn.lock
git switch -c migrate1 #created and switched to a new branch named "migrate1"

--- a/package.json
+++ b/package.json
-	"packageManager": "yarn@1.22.22",
+	"packageManager": "pnpm@10.28.2",

ja import
ja install
```

then some fixes:
added more imports to icarus even though they're dynamic in code
renamed deploy to ship so you can type ja ship rather than pnpm run deploy
pinned og-image to exact version so image will load in cloudflare deployed

3806a97 Feb04Wed GSH migration to pnpm working

updated sem.js to work from pnpm lockfile
fixed the script to error out if it runs into the same module with a different semver
reviewed the output yaml diff is reasonable and we're ready to use this tool now in pnpm-land

49e90b0 Feb04Wed EVJ updated sem.js to work with pnpm now

### Next Steps

**[This is the section we maintain with exact steps to take next.]**

**Nuxt 3 → Nuxt 4 migration (planning):**

1. ☐ Test fresh1 deployment to Cloudflare — proves og-image 5.1.13 works on Nuxt 4
2. ☐ Enable compatibility mode on site (`future: { compatibilityVersion: 4 }`) — surfaces code issues before package upgrade
3. ☐ Test h3 v2 API changes — `getQuery`, `readBody`, `getCookie`, `setCookie` in icarus and middleware
4. ☐ Test error handling — throw in component, verify Datadog logging and error.vue display
5. ☐ Test environment detection — log `senseEnvironment()` in all contexts, verify `isLocal()`/`isCloud()` correct
6. ☐ Update `process.server`/`process.client` → `import.meta.server`/`import.meta.client` (note: senseEnvironment needs different approach)
7. ☐ Move to `app/` directory structure — either via codemod or manually
8. ☐ Update tailwind.config.js content paths for `app/` structure
9. ☐ Upgrade nuxt package to ^4.x
10. ☐ Test nitro-cloudflare-dev removal — verify native Cloudflare emulation works
11. ☐ Test extra deps (wagmi, uppy, qrcode) — should work but verify
12. ☐ Test `nuxi analyze` — verify size reports still generate (client.html, nitro.html)

---

## Trail Notes

**Starting point**

Ran sem and seal, committed, deployed, full smoke test passed (unit tests all environments, og card, qr code, upload, manual and visual, local and cloud). On branch migrate1. Ready to begin Phase 2.

a39ae52 Feb04Wed MEI working nuxt 3 starting point to return to

**Surveying fresh2**

Process: fresh1 stays untouched as permanent reference. fresh2 is working copy — delete files as we review them and confirm they're either not needed or already addressed in site. When fresh2 is empty, we've covered everything.

- `worker-configuration.d.ts` — Generated by `wrangler types`, TypeScript declarations for Workers runtime. Site uses JS not TS, not needed. Deleted.
- `env.d.ts` — TypeScript module augmentation for h3 event context with Cloudflare properties. JS not TS, not needed. Deleted.
- `README.md` — Boilerplate Nuxt commands (install, dev, build, preview). Site already has these scripts. Deleted.
- `tsconfig.json` — Nuxt 4 uses project references (app/server/shared/node) instead of single extends. Site's old one also referenced non-existent file. Overwrote site's copy with fresh1's. Deleted from fresh2.

**Aligning package.json**

Updated site/package.json to match fresh1's versions:

- nuxt 3.20.0 → ^4.3.0
- Bumped vue, vue-router, pinia, @pinia/nuxt, @unhead/vue, unstorage, nitropack, wrangler
- nuxt-og-image 5.1.12 → 5.1.13
- Added h3 2.0.1-rc.11 to devDeps (Nuxt 4 needs explicit h3 v2)
- Moved @nuxtjs/tailwindcss from devDeps to deps, pinned to 6.14.0
- Removed nuxi (nuxt brings it), pino-pretty (pnpm auto-installs peers)
- Kept site's scripts, metadata, and extra deps (wagmi, uppy, qrcode, icarus)

**package.json scripts**

```
		"build": "nuxt build", <fresh>
		"build": "nuxt build", <site>
ok, build is exactly the same. this means we never customized it, which is fine
		"generate": "nuxt generate", <fresh>
		"generate": "nuxt generate", <site>
		"postinstall": "nuxt prepare", <fresh>
		"postinstall": "nuxt prepare", <site>
generate and postinstall exactly the same, also never use these and don't know what they are
		"cf-typegen": "wrangler types", <fresh>
		"retype": "wrangler types", <site>
renamed and never used

		"dev": "nuxt dev", <fresh>
		"local": "nuxt dev", <site>
ok here we just renamed dev to local, also fine

		"preview": "pnpm run build && wrangler dev", <fresh>
		"preview": "nuxt build && wrangler dev", <site>
ok here scaffolding goes back outside to go back into the front door, where we just stay in the house. i think fine?

		"deploy": "pnpm run build && wrangler deploy", <fresh>
		"cloud": "node ../set-cloud.js && nuxt build && wrangler deploy && node ../set-local.js && node ../test.js", <site>
this one is important, let's discuss

		"size": "nuxi analyze --no-serve && open ./size/client.html && open ./size/nitro.html", <site>
this one is new custom ours, so it makes sense that it's not in scaffolding
```

Conclusion: No script changes needed. The Nuxt CLI interface (`nuxt dev`, `nuxt build`, `nuxi analyze`, etc.) is unchanged between v3 and v4. Our build/deploy pipeline stays the same.

**Configuration files**

Bumped both compatibility dates to match fresh1 (scaffolded 2026feb3 ⌚):
- nuxt.config.js `compatibilityDate`: `'2025-06-10'` → `'2025-07-15'` — Nuxt/Nitro framework behavior
- wrangler.jsonc `compatibility_date`: `"2025-06-10"` → `"2025-09-27"` — Cloudflare Workers runtime behavior

These are independent systems (framework vs platform), so the dates don't need to match each other. Comments added explaining what each date controls.

**wrangler.jsonc review**

Reviewed site/wrangler.jsonc against fresh2/wrangler.jsonc. Reorganized comments to integrate fresh scaffold documentation inline near each setting. Final state:

| Setting | Status | Notes |
|---------|--------|-------|
| `$schema` | ✓ present | JSON Schema for editor tooling |
| `name` | ✓ present | "site4" (site-specific) |
| `compatibility_date` | ✓ bumped | "2025-09-27" with ⌚ marker |
| `compatibility_flags` | ✓ kept | `["nodejs_compat"]` — runtime polyfills |
| `observability` | ✓ present | `{enabled: true}` |
| `placement` | ✓ present | `{mode: "smart"}` — fresh has this commented, we enable it |
| `kv_namespaces` | ✓ present | OG_IMAGE_CACHE binding (site-specific) |
| `main`, `assets` | ⚠️ commented | See trouble spot below |

Scaffold boilerplate not copied (correctly): `vars` example, `services` example — these are placeholder code for unused features.

**Potential trouble: `main` and `assets` commented out**

Fresh scaffold includes:
```jsonc
"main": "./.output/server/index.mjs",
"assets": {
  "binding": "ASSETS",
  "directory": "./.output/public/"
}
```

Site omits them because Nitro overrides these at build time and warns:
```
WARN [cloudflare] Wrangler config main is overridden and will be ignored.
```

The concern: if Nuxt 4's Nitro changed how it handles this, deployment could fail with "can't find entry point." We learned to omit them on Nuxt 3; that might not be correct for Nuxt 4.

**If deployment fails:** First thing to try is uncommenting `main` and `assets`. If Nitro still overrides them (causing the warning), fine. If Nitro stopped overriding them, they're now required.

Deleted `wrangler.jsonc` from fresh2.

**nuxt.config.js review**

Compared site/nuxt.config.js (94 lines) against fresh1/nuxt.config.ts (21 lines).

Fresh1 core (all present in site):
- `compatibilityDate` — already bumped ✓
- `devtools: { enabled: true }` ✓
- `nitro.preset: 'cloudflare_module'` ✓
- `nitro.cloudflare.deployConfig: true` ✓
- `nitro.cloudflare.nodeCompat: true` ✓
- `modules`: nitro-cloudflare-dev, pinia, og-image, tailwindcss ✓

Site-specific additions (keep all):
- `build.analyze` — size reports
- `nitro.esbuild.options.target: 'esnext'` — BigInt fix
- `components.dirs` with `pathPrefix: false` — subfolder organization
- `tailwindcss.cssPath` — custom stylesheet
- `app.head.link` — Google Fonts
- `site` config — domain for og-image
- `ogImage` config — KV cache, 20min TTL
- `vue.compilerOptions.isCustomElement` — vidstack media-* tags
- `vite.plugins` — vidstack

No changes needed to nuxt.config.js at this stage. The Cloudflare/Nitro section (lines 36-44) was reviewed in detail — documented three layers of Node compatibility in section [5] nitro-cloudflare-dev, added TODO to test module removal in Phase 3.

Deleted `nuxt.config.ts` from fresh2.

**package.md review**

Reviewed package.md "nuxi effects" section documenting what peer deps each `nuxi module add` brought in during scaffolding. Added explanation that tailwindcss 3.4.19 is a transitive dep of @nuxtjs/tailwindcss — we're on Tailwind 3.x, not 4.x.

Deleted numbered diff files from fresh2 (2pinia.diff, 3ogimage.diff, 4tailwind.diff, 5vidstack.diff, 4tailwind.txt) — their info is now in package.md.

**.gitignore comparison**

Compared fresh2/.gitignore against cold3/.gitignore (root level). Scaffold's ignores are a subset of ours — we cover everything plus serverless, sveltekit, vite timestamps, and more.

Scaffold has `!.env.example` and `!.dev.vars.example` exceptions (allowlist patterns to commit example env files). We deliberately don't use these — no exceptions for anything matching secret patterns, period.

Deleted `.gitignore` from fresh2.

Compared `public/favicon.ico` — identical (same hash). Site already has the Nuxt default favicon as fallback. Deleted from fresh2.

Copied `public/robots.txt` to site — default "allow all" to avoid 404s on crawler requests. Deleted from fresh2.

Deleted `pnpm-lock.yaml` from fresh2 — fresh1 keeps this as reference for known-good scaffold versions.

**app.vue comparison**

Scaffold's app.vue is hello world (NuxtWelcome). Site's is the real app with store init, head config, Turnstile, TopBar/BottomBar.

Notable: scaffold includes `<NuxtRouteAnnouncer />` — accessibility component that announces route changes to screen readers. Site doesn't have this. Consider adding later for a11y.

Directory location: scaffold has `app/app.vue`, site has `site/app.vue` (root level). The `app/` directory restructure is next.

Deleted `app/` folder from fresh2. **fresh2 is now empty.**

**Outer shell changes summary**

Reviewed diff of all site changes. Actual substantive changes are minimal:

| File | Change |
|------|--------|
| nuxt.config.js | `compatibilityDate`: `'2025-06-10'` → `'2025-07-15'` |
| wrangler.jsonc | `compatibility_date`: `"2025-06-10"` → `"2025-09-27"` |
| tsconfig.json | Single `extends` → Nuxt 4 project references (app/server/shared/node) |
| package.json | nuxt 3→4, version bumps, added h3, removed nuxi/pino-pretty |
| public/robots.txt | Added (new file, default "allow all") |

Ready to commit outer shell, then move inwards to `app/` directory structure.

**Directory restructure for Nuxt 4**

Created `site/app/` and moved application code into it:

Files: `app.vue`, `error.vue`

Folders: `assets`, `components`, `composables`, `layouts`, `pages`, `plugins`, `stores`

Stays at site root: `server`, `public`, `nuxt.config.js`, `tailwind.config.js`, `tsconfig.json`, `wrangler.jsonc`, `package.json`

**tailwind.config.js**

Removed manual `content` array entirely. The `@nuxtjs/tailwindcss` module auto-discovers paths based on Nuxt's directory structure — it will find `app/` automatically.

**h3 v1 → v2 migration**

Nuxt 4's Nitro pins to h3 `2.0.1-rc.11` (prerelease). The h3 event object structure changed between v1 and v2 — you can't read a v2 event with v1 functions.

icarus/package.json: `"h3": "^1.13.0"` → `"h3": "2.0.1-rc.11"`

API changes in icarus/level2.js:
- `getQuery` and `readBody` — names unchanged, still work
- `workerEvent.req.headers` → `getRequestHeaders(workerEvent)` (no more direct property access)
- `workerEvent.req.method` → `getMethod(workerEvent)` (no more direct property access)

Minimized h3 surface area: extract from h3 ONCE in `doorWorkerOpen`, then pass plain objects (`door.headers`) everywhere else. This gives us:
- 4 h3 calls in doorWorkerOpen
- 1 wrapper function (getWorkerMethod, parallel to getLambdaMethod)
- 1 import statement with aliased names (h3v2_* prefix for clarity)

Lambda code path unchanged — it reads directly from AWS event structure, not h3.

Rollback to v1 (if needed) — 6 lines in 2 files:

```diff
# icarus/package.json
- "h3": "2.0.1-rc.11",
+ "h3": "^1.13.0",

# icarus/level2.js — import
- import {
- getQuery          as h3v2_getQuery,
- readBody          as h3v2_readBody,
- getRequestHeaders as h3v2_getRequestHeaders,
- getMethod         as h3v2_getMethod,
- } from 'h3'
+ import {getQuery, readBody} from 'h3'

# icarus/level2.js — doorWorkerOpen extraction
- door.headers = h3v2_getRequestHeaders(workerEvent)
+ door.headers = workerEvent.req.headers
- door.query = h3v2_getQuery(workerEvent)
+ door.query = getQuery(workerEvent)
- door.body = await h3v2_readBody(workerEvent)
+ door.body = await readBody(workerEvent)

# icarus/level2.js — getWorkerMethod
- return h3v2_getMethod(workerEvent)
+ return workerEvent.req.method
```

Everything downstream (headerOrigin, checkForwardedSecure, report call, etc.) uses `door.headers` — a plain object either way, unchanged.

**process.client/server → import.meta.client/server**

Nuxt 4 deprecates `process.client`/`process.server` in favor of `import.meta.client`/`import.meta.server`. The difference: `process.*` is runtime, `import.meta.*` is compile-time (Vite replaces with `true`/`false` at build).

Most usage was already `import.meta.*` — only `senseEnvironment()` in icarus/level2.js used `process?.client`/`process?.server` for runtime environment detection.

Changed senseEnvironment() to use `import.meta.*` and moved the checks outside the `if (type(typeof process))` block. In non-Vite environments (Lambda, plain Node), `import.meta.client` is `undefined` (falsy), so behavior is identical. Future-proofs against Nuxt eventually removing `process.client`/`process.server`.

---

**Phase 2 Complete**

All code and configuration changes from Phase 2 table (lines 729-741) are done:

- 2a: package.json versions aligned with fresh1, carets restored
- 2b: nuxt.config.js patterns, compatibilityDate, nitro-cloudflare-dev removed
- 2c: app/ directory structure, tailwind.config.js content array removed
- 2d: h3 v2 migration, process.client/server → import.meta.*, senseEnvironment updated

Ready for Phase 3: fix-a-thon. `pnpm install`, build, dev, test, deploy.





