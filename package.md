
# Essays and guides

## 🥀 Code rot

Full-stack JavaScript rots fast. Six months of not touching dependencies and several modules will be on new major versions, their transitive trees will have shifted, and peer dependency expectations will have changed. Nuxt, Cloudflare's CLI, Tailwind, Vite, and pnpm each think they're the center of the universe — each ships majors on their own schedule, each assuming the rest of the world will follow. When one moves, others follow on their own timelines, and for a window — sometimes a long window — nothing fits together cleanly. You can't just `pnpm update` your way out, because the conflicts aren't in your code; they're in the space between modules that were each tested against different snapshots of the ecosystem.

To keep the project current without spending weeks updating modules individually, testing everything, and then moving on to the next one, the Network 23 Software Engineering Division employs a manœuvre we call *repot the plant* — scaffold a fresh project, compare it against what we have, and port our code to resemble the new pot. 🪴

## 🌅 Update once a year

Every framework version has a lifecycle, and there's a sweet spot in the middle of it. Move too early and you pay the pioneer tax — modules have bugs, edge cases are uncharted, you're debugging the platform instead of building product, and the problems you solve will solve themselves in a few months anyway. Move too late and you pay the stagnation tax — dependencies start requiring the new major, security patches slow down, you can't update within your declared semver ranges, and what would have been a two-day migration in January becomes a two-week one in June.

Nuxt ships a new major roughly every summer. The sweet spot is midwinter — about six months after release. Major bugs are fixed, module authors have updated, the ecosystem has settled. You still have a full runway before the next cycle starts. The discipline is to treat migration as a scheduled event, not something you do reactively when forced or rush into the moment a new version drops. Once a year, in the middle of the cycle, when the version is proven and the runway is long.

## 🩹 Update everything at once

We took the "tear off the bandaid" approach: make all changes without running the code, then fix whatever breaks. This worked, and it worked because of the fresh scaffold. We scaffolded a fresh Nuxt 4 project on Cloudflare Workers, then systematically matched our site to it — versions, directory structure, config patterns — outwards to inwards, dependencies first, then configuration, then code.

The alternative — incremental migration with compatibility flags, codemods, and one-change-at-a-time testing — would have been worse. Not just slower (two days of work stretched to two weeks of context-switching), but genuinely riskier. Incremental migration can lead you into impossible intermediate states: a half-upgraded dependency tree where nothing works forward or backward. Nuxt's `future: { compatibilityVersion: 4 }` compatibility mode doesn't know about Cloudflare Workers. Codemods don't know about our h3 abstraction layer or og-image's WASM constraints. Each cautious intermediate test would have been testing a combination that nobody upstream ever tested.

The all-at-once approach avoided this by targeting a known-good end state (the scaffold) rather than navigating through unknown intermediate states. The safety net wasn't incremental testing — it was git. `git switch main` returns to working Nuxt 3 at any time. Fix forward or retreat completely — no partial rollbacks, no "keep this module on the old version while upgrading the rest."

This approach does require fixing forward through surprises. We hit h3 v2 shadowing, WASM breakage on Workers, and a three-migration dependency chain. But each surprise was encountered with the full picture visible — all the changes on the table, all the versions aligned to the target — not buried under layers of incremental half-changes where any one of a dozen intermediate steps could be the culprit.

## 🍓 Scaffold fresh

Modern full-stack JavaScript has several top-level dependencies the team is responsible for: cloud provider, package manager, web framework, their associated tooling, and framework modules. These compete for authority — Nuxt, Cloudflare's CLI, and pnpm each assume they're the starting point and everything else will follow their conventions. Each releases major versions on its own schedule, and their ecosystems of modules follow. When Nuxt 4 ships, Pinia updates, Tailwind updates, Wrangler updates its integration — and each brings its own dependency tree and peer dependency requirements.

This creates a difficult reality. There is no single source of truth for "what versions work together." Nuxt's migration guide doesn't know about Cloudflare. Cloudflare's scaffold doesn't know about og-image. og-image's docs don't know about your WASM constraints on Workers. Upgrading in place means changing one thing, watching peer dependencies conflict, chasing errors through transitive dependency mazes, and never being sure if the problem is your code, your config, or dependency hell.

Scaffolding fresh cuts through this. Run `pnpm create cloudflare@latest`, pick Nuxt, add your modules with `nuxi module add` — and you have a working project that represents the current blessed combination of versions and configs as the CLI tools understand it today. Not what the docs say should work, not what worked six months ago, but what actually resolves and builds right now. This is your reference point. Compare it against your current setup, and you know exactly what needs to change. The scaffold is disposable — an inert folder you examine and discard. Your real project keeps its git history, deployment pipeline, and wrangler bindings. The scaffold just tells you where to aim.

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

rm -rf .git .nuxt .output .vscode .wrangler node_modules
cd ../..
rm -rf cold3/fresh1
mv temp/fresh1 cold3/fresh1

  fresh1 will be an inert folder in the monorepo, alongside named workspace folders
  and you and claude can examine
  you can also $ cp -r fresh1 fresh2 to boil down fresh2 as you update or decline granular differences
```

*Note that the scaffold gave us `nuxt-og-image` 5.1.13 (the latest stable at the time), plus `@unhead/vue` and `unstorage` as peer deps injected by `nuxi module add`. After the Nuxt 4 jump, og-image v5 broke on Cloudflare Workers under Nitro 2.13.1's new WASM bundling — v6 beta was the only fix, and it required Tailwind 4. So the scaffold's og-image, tailwind, and their related packages aren't what we're using. We replaced them manually: `nuxt-og-image@6.0.0-beta.15` (exact pin), `satori@0.15.2` (exact pin — 0.16+ blocked on Workers), `@resvg/resvg-wasm`, `@resvg/resvg-js`, `tailwindcss`, `@tailwindcss/vite`, and `@tailwindcss/forms`. Details in the og-image and Tailwind trail notes below.*

## 🎁 Choosing to upgrade or hold

sem.yaml flags when a major version is available. A flag is not an obligation — a major version bump on npm doesn't mean we have to do anything. The question is whether the distance between where we are and where the module has gone creates real cost. An upgrade is compelling when staying behind is actively costing us something. It's fine to defer when it isn't.

**Reasons to upgrade.** Ecosystem alignment is the strongest signal — the rest of our stack has moved to expect the new version, and staying behind creates peer dep tension or blocks future upgrades. h3 v2 will arrive when Nuxt 5 ships it via Nitro v3; Vite 7 will pull plugin-vue 6 and vite-plugin-svelte 6 with it. When that happens, we'll need to move. Better internals matter too: h3 v2 is a ground-up rewrite that shrinks the dependency tree from 9 packages to 2 and the bundle from ~40 KB to ~4 KB. And dependency tree cleanup — when the old major pulls in transitive deps that are deprecated or unmaintained, and the new major drops them.

**Reasons to hold.** If the installed version works and the new major doesn't unlock something we need, let it sit. The new major might still be in prerelease — h3 v2 has been in RC since October 2024 with 14 release candidates — and upgrading to an RC means signing up for more churn, not less. Our usage might be shallow enough that the breaking changes don't touch us, but this has to be verified by grepping for actual imports, not assumed. And some packages are framework-constrained: h3 is literally bundled inside Nitro, vue-router 5 is a major rewrite that Nuxt's routing abstraction would need to explicitly adopt, and plugin-vue v6 is loaded through Nuxt's own Vite pipeline. Bumping any of these before Nuxt officially supports them is swimming upstream. They all move when Nuxt moves.

**Coupled upgrades.** Some modules travel in groups and should be evaluated together, not individually. wagmi/connectors and wagmi/core need to move together and may require viem changes. Vite 7 will require plugin-vue 6 in icarus and vite-plugin-svelte 6 in oauth. These coupled upgrades are bigger projects — mapping the dependency chains to find the groups is part of the evaluation.

**Cadence matters.** A module that ships majors every few months is signaling something different than one that ships every 1–2 years. @sveltejs/vite-plugin-svelte cut v4 in October 2024, v5 in November 2024, v6 in July 2025, and v7-next already exists — each just tracks a Vite major, averaging one every 4–5 months. Chasing that is treadmill; upgrading now clears the flag for a few months before the next major lands. Meanwhile h3 has been on v1 for years and v2 is a deliberate architectural shift — being a full cycle behind that matters more.

**How to evaluate.** The goal is to get from "there's a new major" to "do it," "do it as part of a group," or "not now" as efficiently as possible. Read the changelog for what actually broke — API removals, renamed exports, dropped Node versions, new required peer deps. Grep the codebase for all imports from the module to understand how deep our usage goes. Compare transitive dependency trees between old and new (`pnpm why` is the tool). And check whether the upgrade is isolated or coupled to other modules on the list.

# package.json notes

four categories used in the sections below:

1 icarus
2 utility
3 service
4 framework

./package.json (root)
```json
{
	"name": "w5",
	"dependencies": {

		//1 icarus
		"icarus": "workspace:*"
	},
	"devDependencies": {

		//2 utility
		"@electric-sql/pglite": "^0.3.15",//wasm PostgreSQL build for local development tests
		"fast-glob": "^3.3.3",//pnpm seal uses fast-glob; pnpm wash uses rimraf, install that one globally
		"nanoid": "^5.1.6",
		"otpauth": "^9.5.0",//these two are for fuzz tests you can turn on in level1 and run with $ pnpm test
		"semver": "^7.7.4",
		"yaml": "^2.8.2",//these two are for sem.js to make sem.yaml
	}
}
```

./icarus/package.json
```json
{
	"name": "icarus",
	"dependencies": {

		//2 utility
		"credit-card-type": "^10.1.2",
		"libphonenumber-js": "^1.12.36",
		"zod": "^4.3.6",
		"is-mobile": "^5.0.0",//runs fine everywhere, but only makes sense running from browser client
		"viem": "^2.45.1",//in icarus as well as site to validate ethereum addresses, net23.zip +10mb with viem and ox
		"qrcode": "^1.5.4",//importable in node and browser but not web worker

		//2 utility, uppy
		"@uppy/core": "^5.2.0",//file upload orchestrator: state, events, restrictions, plugin system
		"@uppy/dashboard": "^5.1.1",//full-featured upload ui: drag-drop, progress, previews, file list
		"@uppy/aws-s3": "^5.1.0",//upload destination plugin for s3 via presigned urls, includes multipart

		//2 utility, viem and wagmi
		"@wagmi/core": "^3.3.2",//wallet connection state management
		"@wagmi/connectors": "^7.1.6",//adapters for metamask, walletconnect, and other wallets

		//3 service
		"@supabase/supabase-js": "^2.95.3",//supabase works local | deployed × worker | lambda

		//4 framework
		"h3": "^1.15.5",
		"ofetch": "^1.5.1",//nuxt brings in these two; added them to icarus so code can use them directly in icarus for lambda
	},
	"devDependencies": {

		//4 framework
		"@vitejs/plugin-vue": "^5.2.4",
		"vite": "^6.4.1",
		"vue": "^3.5.27",
		"vue-router": "^4.6.4",
	}
}
```

./net23/package.json
```json
{
	"name": "net23",
	"dependencies": {

		//1 icarus
		"icarus": "workspace:*",

		//2 utility
		"sharp": "^0.34.5",//needs native modules that get into net23.zip with the stowaway.js script

		//3 service
		"twilio": "^5.12.1",
		"@sendgrid/mail": "^8.1.6",
	},
	"devDependencies": {

		//2 utility
		"fs-extra": "^11.3.3",//for stowaway script

		//3 service
		"@aws-sdk/client-ses": "^3.985.0",//aws sdk v3 parts are already on lambda; these dev dependencies just for local development
		"@aws-sdk/client-sns": "^3.985.0",
		"@aws-sdk/client-s3": "^3.985.0",
		"@aws-sdk/s3-request-presigner": "^3.985.0",
		"@vercel/nft": "^1.3.0",//vercel's node file trace to build a lean net23.zip

		//4 framework
		"serverless": "^4.31.2",
		"serverless-offline": "^14.4.0",
	}
}
```

./oauth/package.json
```json
{
	"name": "oauth",
	"dependencies": {

		//1 icarus
		"icarus": "workspace:*",

		//2 utility
		"@auth/sveltekit": "^1.11.1",
	},
	"devDependencies": {

		//3 service
		"wrangler": "^4.63.0",

		//4 framework
		"@sveltejs/adapter-cloudflare": "^7.2.6",//adapter-auto removed — scaffolding bloat, we import adapter-cloudflare directly
		"@sveltejs/kit": "^2.50.2",
		"@sveltejs/vite-plugin-svelte": "^5.1.1",
		"svelte": "^5.50.0",
		"vite": "^6.4.1",
	}
}
```

./site/package.json
```json
{
	"name": "site4",
	"dependencies": {

		//1 icarus
		"icarus": "workspace:*",

		//2 utility, individual
		"qrcode": "^1.5.4",//importable in node and browser but not web worker!
		"vidstack": "^1.12.13",

		//2 utility, nuxt-og-image and its rendering pipeline
		"nuxt-og-image": "6.0.0-beta.15",//exact pin — carets don't float on prereleases
		"satori": "0.15.2",//exact pin — 0.16+ breaks Cloudflare Workers (WebAssembly.instantiate blocked)
		"@resvg/resvg-wasm": "^2.6.2",//SVG → PNG via Rust/WASM (production)
		"@resvg/resvg-js": "^2.6.2",//SVG → PNG via native N-API (local dev); nuxt-og-image selects from Nitro preset
		"@unhead/vue": "^2.1.3",//peer dep of nuxt-og-image, injected by nuxi module add
		"unstorage": "^1.17.4",//universal key-value storage abstraction; peer dep of nuxt-og-image for cache driver system

		//2 utility, viem and wagmi
		"viem": "^2.45.1",//functions to read, write, encode for the ethereum blockchain
		"@wagmi/core": "^3.3.2",//wallet connection state management
		"@wagmi/connectors": "^7.1.6",//adapters for metamask, walletconnect, and other wallets

		//2 utility, uppy
		"@uppy/core": "^5.2.0",//file upload orchestrator: state, events, restrictions, plugin system
		"@uppy/dashboard": "^5.1.1",//full-featured upload ui: drag-drop, progress, previews, file list
		"@uppy/aws-s3": "^5.1.0",//upload destination plugin for s3 via presigned urls, includes multipart

		//2 utility, tailwind — now a direct dependency, not through a Nuxt module
		"tailwindcss": "^4.1.18",
		"@tailwindcss/vite": "^4.1.18",//Vite plugin, registered in nuxt.config.js

		//4 framework
		"@pinia/nuxt": "0.11.3",//exact pin from nuxi module add; 0.11.3 is latest
		"nuxt": "^4.3.0",
		"pinia": "^3.0.4",
		"vue": "^3.5.27",
		"vue-router": "^4.6.4",
	},
	"devDependencies": {

		//2 utility
		"@tailwindcss/forms": "^0.5.11",//form control normalization plugin, loaded via @plugin in CSS

		//3 service
		"wrangler": "^4.63.0",

		//4 framework
		"nitropack": "^2.13.1",
	}
}
```

# Trail notes from 2026feb migration Yarn classic → pnpm latest, Nuxt 3→4, then Tailwind 3→4, and nuxt-og-image 5→6

## Yarn Classic → pnpm latest

Yarn Classic (1.22.22) was the original package manager for this monorepo. It worked, but it had real costs: no automatic peer dep installation (failures are silent — you discover missing peers at runtime or not at all), permissive hoisting that lets code import undeclared transitive deps (works until someone else's update rearranges the tree), and a lockfile format that sem.js had to parse separately. pnpm 10 fixes all three.

**Peer dependencies.** pnpm auto-installs peers by default (`auto-install-peers=true`). Where Yarn Classic fails silently when a transitive dep declares a peer, pnpm resolves and installs it automatically. The living example is @unhead/vue and unstorage — both are peer deps of nuxt-og-image that `nuxi module add og-image` injected into our package.json (nuxi does this, not pnpm — `pnpm add` only writes the one package you asked for). Under pnpm they'd be auto-installed even without the explicit declarations, but we keep them in package.json because pnpm's strict resolution needs them visible at the site level for og-image's cache driver system to work. Gotcha: auto-installed peers are accessible to the package that declared them, but not always to your own code — pnpm doesn't hoist them to where your imports can see them. You shouldn't import packages you don't declare anyway, but it can confuse anyone used to Yarn's more permissive hoisting.

**We're on pnpm defaults — no `.npmrc` needed.** We anticipated needing custom settings for `strict-peer-dependencies` (walletconnect's complex peer tree) and hoisting strictness (undeclared transitive imports). Neither materialized. pnpm defaults to warning on peer conflicts without erroring, and an audit of all imports found nothing undeclared. h3 and ofetch are intentionally declared in icarus even though Nuxt also brings them — Lambda code uses them directly and doesn't have Nuxt.

**Dependency cleanup principle.** Before removing a dependency, ask "why is it here?" not "can we delete it?" Check package.md for origin notes, `pnpm why` for the dependency graph, and the code for actual imports. A package with no imports can still be load-bearing — peer deps that another package needs resolved, driver systems like unstorage's `cloudflare-kv-binding`, or plugin registrations. The og-image section documents the specific cases of @unhead/vue and unstorage, both injected by `nuxi module add og-image` and both load-bearing despite also being brought in transitively.

**sem.js.** Updated to read pnpm's lockfile format (`pnpm-lock.yaml`) instead of Yarn's. pnpm uses `pnpm-workspace.yaml` for workspace configuration (not the `workspaces` field in package.json — pnpm ignores that).

## Nuxt 3→4, including framework-constrained holds

Nuxt 3 → Nuxt 4.3.0 (Nitro 2.13.1, Vite 6). This was the annual stack upgrade. It cascaded: after the Nuxt jump, og-image v5 broke under Nitro 2.13.1's new WASM bundling, which forced v6, which required Tailwind 4 — so one migration became three.

**What actually changed.** Substantive changes between Nuxt 3 and 4 were minimal. We scaffolded a fresh Nuxt 4 project on Cloudflare Workers, compared every file, and found five real differences: `nuxt` version bump in package.json, `compatibilityDate` bump in nuxt.config.js, `compatibility_date` bump in wrangler.jsonc, `tsconfig.json` switching from single `extends` to Nuxt 4 project references (app/server/shared/node), and a `public/robots.txt`. Scripts (`nuxt dev`, `nuxt build`) are unchanged. Compatibility dates are independent systems — nuxt.config governs Nuxt/Nitro framework behavior, wrangler.jsonc governs Cloudflare Workers runtime — and don't need to match.

**Directory restructure.** Created `site/app/` and moved application code into it: `app.vue`, `error.vue`, plus `assets`, `components`, `composables`, `layouts`, `pages`, `plugins`, `stores`. Stays at site root: `server`, `public`, `nuxt.config.js`, `tsconfig.json`, `wrangler.jsonc`, `package.json`.

**import.meta.client/server.** Nuxt 4 deprecates runtime `process.client`/`process.server` in favor of compile-time `import.meta.client`/`import.meta.server` (Vite replaces these with `true`/`false` at build time, enabling dead-code elimination). Updated `senseEnvironment()` in icarus/level2.js. In non-Vite environments (Lambda, plain Node), `import.meta.client` is `undefined` (falsy), so behavior is identical to the old `process.client` — no branching needed.

**The h3 v2 false start.** The fresh scaffold included `"h3": "2.0.1-rc.11"` in devDependencies. We copied it, trusting the scaffold. First build failed: `"sendError" is not exported by h3@2.0.1-rc.11` — nuxt-og-image's satori renderer imports `sendError`, which h3 v2 removed. The wrong assumption was that Nuxt 4 = h3 v2. It doesn't. Nuxt 4.3.0 / Nitro 2.13.1 still runs h3 v1; h3 v2 arrives with Nitro v3, which ships with Nuxt 5. The scaffold didn't have og-image, so the conflict never surfaced there. pnpm resolved the scaffold's h3 v2 as top-level, shadowing Nitro's v1 for every transitive dep. Fix: removed h3 v2, let Nitro provide h3 v1. Lesson: don't blindly copy devDeps that pin prerelease versions of framework internals — check what Nitro actually resolves with `pnpm why h3 -r`.

**h3 abstraction layer.** Abstracted all direct h3 access in `icarus/level2.js` behind four `getWorker*` one-liners — `getWorkerQuery`, `getWorkerHeaders`, `getWorkerMethod`, `getWorkerBody` — that feed `doorWorkerOpen()`, the single entry point for all ~16 API routes. Nitro auto-imports (`defineEventHandler`, `getCookie`/`setCookie`, `setResponseStatus`) are Nitro's globals, not our direct h3 calls. When Nuxt 5 brings h3 v2, the migration is a four-function change.

**Version cleanup.** Beyond the framework jump, bumped 12 packages flagged 🏺 in sem.yaml (declared release 1+ year behind installed) to `^<installed>`: fast-glob, supabase-js, credit-card-type, libphonenumber-js, ofetch, client-ses, client-sns, twilio, fs-extra, serverless, sveltejs/kit, svelte. Mechanical gap-closing — no behavior change, no new versions pulled — returning to a stack that rides semver ranges forward instead of depending on an old lockfile.

**Framework-constrained holds.** Four packages show 🎁 in sem.yaml (major version available) but are held because they're constrained by Nuxt:

- **h3** (1.15.5, v2 available) — literally bundled inside Nitro. Our two direct imports (`getQuery`, `readBody`) are wrapped behind the `getWorker*` abstraction, ready for the Nuxt 5 migration. v2 is still in RC (14 RCs since October 2024), a ground-up rewrite replacing Node.js primitives with web standards.
- **vite** (6.4.1, v7 available) — Nuxt 4's build pipeline is built on Vite 6. icarus and oauth declare vite directly for their own build configs and should stay aligned with what Nuxt expects. Vite 7 changes plugin APIs that Nuxt's internal Vite config depends on.
- **@vitejs/plugin-vue** (5.2.4, v6 available) — in icarus for the TDD runner's Vue dev server. Loaded through Nuxt's own Vite pipeline in the site workspace. Bumping it without Nuxt expecting v6 risks conflicts.
- **vue-router** (4.6.4, v5 available) — Nuxt's entire routing abstraction (`useRouter()`, `<NuxtLink>`, file-based routing, middleware) is built on vue-router 4. v5 is a major rewrite that Nuxt would need to explicitly adopt.

All four move when Nuxt moves. Upgrading any of them independently is swimming upstream.

**Scaffold notes for future.** `main` and `assets` are commented out in wrangler.jsonc because Nitro overrides them at build time (`deployConfig: true` in nuxt.config). If a future Nitro version stops overriding, deployment will fail with "can't find entry point" — uncommenting is the first fix to try. The scaffold also includes `<NuxtRouteAnnouncer />` for accessibility (announces route changes to screen readers) — not added yet, consider for an accessibility pass.

## Tailwind 3→4, including switching to use it directly

We were on Tailwind 3 via `@nuxtjs/tailwindcss`, a Nuxt module that wraps Tailwind and manages its Vite integration. The scaffold's `nuxi module add tailwindcss` gave us the same thing — `@nuxtjs/tailwindcss` 6.14.0, which pulls in `tailwindcss` 3.4.19 transitively. You don't declare `tailwindcss` directly in package.json; the Nuxt module brings it in. This was fine until og-image v6 forced us to Tailwind 4 (see the og-image section below).

Tailwind 4 is a different animal. Configuration moved from `tailwind.config.js` into CSS — `@import`, `@theme`, `@plugin` directives inside the stylesheet itself. And the recommended installation path changed: instead of a Nuxt module wrapping Tailwind, you use `@tailwindcss/vite` as a direct Vite plugin. `@nuxtjs/tailwindcss` is now in maintenance mode; Nuxt UI v3 took the same path — it requires TW4 and explicitly conflicts with `@nuxtjs/tailwindcss`. If we ever shop for a component library, Nuxt UI v3 fits our stack.

```
tailwindcss         ^4.1.18   The framework itself — now a direct dependency in package.json
@tailwindcss/vite   ^4.1.18   Vite plugin, registered in nuxt.config.js alongside vidstack
@tailwindcss/forms  ^0.5.11   Form control normalization plugin, loaded via @plugin in CSS
```

**Global stylesheet** at `site/app/assets/css/style.css` is now the single source of Tailwind configuration:
- `@font-face` declarations for two bundled woff2 fonts (Diatype Rounded, Lemon Wide)
- `@import "tailwindcss"` — single import replaces the old three `@tailwind` directives
- `@plugin "@tailwindcss/forms"` — normalizes form controls
- `@theme` — overrides `--font-sans` (Diatype Rounded → Noto Sans → system) and `--font-mono` (Noto Sans Mono → system)
- `@layer base` — body defaults, link colors, code styling
- `@layer components` — `.my-button`, `.my-link`, and state classes (`.ghost`, `.ready`, `.doing`)

**Fonts.** Three delivery methods, all independent of Tailwind. Diatype Rounded and Lemon Wide are bundled woff2 files in `public/fonts/`. Noto Sans, Noto Sans Mono, and Roboto come from Google Fonts CDN links in nuxt.config.js — Noto Sans is the `--font-sans` fallback, Noto Sans Mono is `--font-mono`, Roboto is for the terms document. System fallback stacks at the tail of every font-family list.

**Component styling patterns.** Out of ~70 Vue files, three patterns: utility classes in templates (~57 files, the dominant and preferred default), scoped `@apply` (9 files — named class wrapping Tailwind utilities), and raw scoped CSS (4 files — fixed positioning, pixel values, `!important` overrides that Tailwind can't express).

**@reference is required for scoped @apply.** In v4, `@apply` in `<style scoped>` can't resolve Tailwind classes without `@reference "tailwindcss"` at the top of the style block. Without it, the build fails with "Cannot apply unknown utility class." Nine components currently have it: CredentialCorner, CredentialPanel, SignUpOrSignInForm, PostPage, ProfilePage, TermsPage, TermsComponent, TermsDocument, TermsAnchors.

**Custom font utilities don't work in scoped @apply.** `@reference "tailwindcss"` gives access to Tailwind's built-in utilities but not custom names defined in our `@theme`. The built-in `font-sans` and `font-mono` work because Tailwind knows those names — our `@theme` just overrides their values. But if we defined `--font-roboto` in `@theme`, `@apply font-roboto` would fail in any scoped style block. The rule: for one-off font choices, use plain CSS (`font-family: "Roboto", sans-serif`). The browser knows the font because the Google Fonts `<link>` loaded it. This is what TermsDocument.vue and TermsComponent.vue do for Roboto. Pointing `@reference` at our stylesheet instead of `"tailwindcss"` would fix this, but requires a subpath import (Vite aliases don't work inside `@reference`) and heavier compilation — not worth it for two font references.

**Google Fonts CSS2 API requires sorted axis tuples.** Found and fixed during migration: the Google Fonts URL had unsorted axis tuples (`ital,wght@0,400;1,400;0,700;1,700`), which the CSS2 API silently rejects with HTTP 400. All three linked fonts were failing to load on production — pages rendered in system fonts instead. The fix: sort numerically (`ital,wght@0,400;0,700;1,400;1,700`). Also removed the `&subset=latin,latin-ext` parameter (CSS v1 API feature; CSS2 handles subsetting automatically via `unicode-range`).

## nuxt-og-image 5→6, including pinning to the current beta

OG image generation runs on Cloudflare Workers in production. Pages call `defineOgImage()` with a template name and props; nuxt-og-image handles meta tag injection, KV caching, and orchestrates a rendering pipeline: HTML/CSS through satori (Vercel's tool) to SVG, then through resvg (Rust/WASM) to PNG. Yoga (Facebook's CSS flexbox engine, also WASM) handles layout inside satori.

We have two custom satori templates in `app/components/OgImage/` — HomeCard and ProfileCard. Simple flex layouts, Inter font, white background with gray border. These must be local `.satori.vue` files, not community templates, because Workers I/O isolation blocks runtime fetching. `index.vue` calls `defineOgImage('HomeCard', {sticker})`, `card/[more].vue` calls `defineOgImage('ProfileCard', {title, sticker})`.

```
nuxt-og-image      6.0.0-beta.15  Nuxt integration, composable API, KV cache  exact pin — carets don't float on prereleases
satori             0.15.2         HTML/CSS → SVG (Vercel)                     exact pin — 0.16+ breaks Cloudflare Workers
@resvg/resvg-wasm  ^2.6.2         SVG → PNG via Rust/WASM (production)        caret — stable, largest artifact is 2.48 MB WASM binary
@resvg/resvg-js    ^2.6.2         SVG → PNG via native N-API (local dev)      nuxt-og-image selects between wasm/js from Nitro preset

(above group is top level in site/package.json; below are transitive through satori)

yoga-wasm-web         0.3.3         CSS flexbox layout (Facebook, C++/WASM)
@shuding/opentype.js  1.4.0-beta.0  Font parsing for satori
```

`nuxi module add og-image` injects three packages into your package.json: nuxt-og-image itself, plus `@unhead/vue` and `unstorage` as peer deps it needs elevated. Both are load-bearing — @unhead/vue for head management, unstorage for the KV cache driver system (`cloudflare-kv-binding` pointing to `OG_IMAGE_CACHE` namespace). Keep both even though nuxt also brings them transitively; pnpm's strict resolution requires the explicit declarations.

**The satori ceiling.** Satori is Vercel's tool, maintained for `@vercel/og` on their edge runtime. Satori 0.16+ switched to runtime `WebAssembly.instantiate()` — works on Vercel Edge Functions, blocked on Cloudflare Workers (vercel/satori#693, no fix planned). nuxt-og-image v6 bridges this by hardcoding `cloudflare-module` to the `"0-15-wasm"` satori binding with `esmImport: true`. This is a deliberate ceiling — satori improvements after 0.15 don't reach Cloudflare users. Every path on Workers ends at this wall, whether through nuxt-og-image, @cf-wasm/og, or a hand-rolled server route. Stable for now — our cards are simple, we don't need cutting-edge CSS layout.

**How we got to v6.** During the Nuxt 4 migration, og-image v5 started 500ing on production Workers: `CompileError: WebAssembly.instantiate(): Wasm code generation disallowed by embedder`. WASM on Workers is invisible in local dev — the only way to catch this is deploying. We ruled out Cloudflare's compatibility_date by rolling it back; the cause was Nitro 2.13.1's WASM bundling for the cloudflare-module preset. v5 has no fix planned — the WASM fixes are v6 only. But v6 requires Tailwind v4, so "upgrade Nuxt" cascaded into three stacked migrations: Nuxt 3→4, then Tailwind 3→4, then og-image 5→6.

**Worries.** Satori is Vercel's — no incentive to accommodate a competitor's platform. We're pinned to exact versions, frozen until we manually update. nuxt-og-image is beta with a single maintainer (Harlan Wilton) — active but fragile bus factor.

**Hopes.** A build-time WASM transform that rewrites `WebAssembly.instantiate()` to pre-compiled imports could unlock newer satori on Workers. Cloudflare could relax WASM restrictions as WASM grows (though it's a core security boundary). And when v6 goes stable, semver floats normally and we can stop pinning.

**To update** to a newer beta: `pnpm add nuxt-og-image@beta`. Once v6 goes stable: switch to `"nuxt-og-image": "^6.0.0"` and semver floats normally.

## SvelteKit and Auth.js in the oauth workspace

The oauth workspace exists because of Auth.js. We needed a way for users to prove they control a social media account — just once, right now — without adopting a full identity provider that owns all our users, sets cookie policies, and can deplatform us without recourse. Auth.js (formerly NextAuth) is the best npm module for this: high-level enough to have pluggable provider modules that iron out the differences between OAuth v1, v2, and PKCE across providers, but low-level enough that it doesn't try to own user sessions or identity.

The problem is Auth.js doesn't have a Nuxt adapter. The @auth/nuxt PR has been open since 2023 with no resolution. We tried @auth/core directly in Nuxt and couldn't get it working. Auth.js has maintained adapters for Next.js and SvelteKit — we chose SvelteKit over Next.js. That required creating a third workspace: a minimal SvelteKit site on Cloudflare Workers at the oauth subdomain, alongside the Nuxt site and Lambda.

```
@auth/sveltekit              ^1.11.1   Auth.js adapter — the reason this workspace exists
@sveltejs/kit                ^2.50.2   SvelteKit framework
@sveltejs/adapter-cloudflare ^7.2.6    Deploys to Cloudflare Workers (adapter-auto removed — scaffolding bloat)
svelte                       ^5.50.0   UI framework (barely used — 2 pages)
@sveltejs/vite-plugin-svelte ^5.1.1    Svelte's Vite plugin — held at v5, v6 tracks Vite 7
vite                         ^6.4.1    Build tool — held at v6, same as Nuxt's constraint
wrangler                     ^4.63.0   Cloudflare CLI
```

Everything is on current versions within its major. The two held packages (vite, vite-plugin-svelte) are the same Vite-major constraint described in the Nuxt section — they'll move when Vite 7 becomes the ecosystem baseline. @auth/sveltekit 1.11.1 is the latest release, and SvelteKit 2.x and adapter-cloudflare 7.x are both current with carets that float on `pnpm install`.
