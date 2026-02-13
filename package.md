
# package.json notes

## Essays and guides

### 🌅 Update once a year

Every framework version has a lifecycle, and there's a sweet spot in the middle of it. Move too early and you pay the pioneer tax — modules have bugs, edge cases are uncharted, you're debugging the platform instead of building product, and the problems you solve will solve themselves in a few months anyway. Move too late and you pay the stagnation tax — dependencies start requiring the new major, security patches slow down, you can't update within your declared semver ranges, and what would have been a two-day migration in January becomes a two-week one in June.

Nuxt ships a new major roughly every summer. The sweet spot is midwinter — about six months after release. Major bugs are fixed, module authors have updated, the ecosystem has settled. You still have a full runway before the next cycle starts. The discipline is to treat migration as a scheduled event, not something you do reactively when forced or rush into the moment a new version drops. Once a year, in the middle of the cycle, when the version is proven and the runway is long.

### 🩹 Update everything at once

We took the "tear off the bandaid" approach: make all changes without running the code, then fix whatever breaks. This worked, and it worked because of the fresh scaffold. We scaffolded a fresh Nuxt 4 project on Cloudflare Workers, then systematically matched our site to it — versions, directory structure, config patterns — outwards to inwards, dependencies first, then configuration, then code.

The alternative — incremental migration with compatibility flags, codemods, and one-change-at-a-time testing — would have been worse. Not just slower (two days of work stretched to two weeks of context-switching), but genuinely riskier. Incremental migration can lead you into impossible intermediate states: a half-upgraded dependency tree where nothing works forward or backward. Nuxt's `future: { compatibilityVersion: 4 }` compatibility mode doesn't know about Cloudflare Workers. Codemods don't know about our h3 abstraction layer or og-image's WASM constraints. Each cautious intermediate test would have been testing a combination that nobody upstream ever tested.

The all-at-once approach avoided this by targeting a known-good end state (the scaffold) rather than navigating through unknown intermediate states. The safety net wasn't incremental testing — it was git. `git switch main` returns to working Nuxt 3 at any time. Fix forward or retreat completely — no partial rollbacks, no "keep this module on the old version while upgrading the rest."

This approach does require fixing forward through surprises. We hit h3 v2 shadowing, WASM breakage on Workers, and a three-migration dependency chain. But each surprise was encountered with the full picture visible — all the changes on the table, all the versions aligned to the target — not buried under layers of incremental half-changes where any one of a dozen intermediate steps could be the culprit.

### 🍓 Scaffold fresh

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

## Trail notes from 2026feb migration nuxt 3->4, tailwind 3->4, nuxt-og-image 5->6





ttd february, condense and update below
- nuxi effects section is from recent scaffolding
- why tailwind doesn't matter now that we're on tailwind 4 and it's listd in package.json directly
- package.json notes after that are all from the old days on yarn classic with nuxt 3


## analysis, 2026feb7

Post-migration review of sem.yaml. No dead weight found, no urgent upgrades.

**@resvg/resvg-js and @resvg/resvg-wasm** — Both needed. nuxt-og-image selects between them based on the Nitro preset. resvg-wasm runs in production on Cloudflare Workers (WASM binary in V8 isolate). resvg-js runs during local dev (native N-API addon, faster, crash-isolated in a worker thread). Both at latest stable (2.6.2), only a 2.7.0-alpha.2 prerelease exists beyond that.

**@pinia/nuxt exact pin (0.11.3)** — Harmless. 0.11.3 is the latest version, nothing newer exists. Since it's pre-1.0, `^0.11.3` would only float to `0.11.4+` anyway. The exact pin came from `nuxi module add`, not a deliberate decision. Same pattern visible with nuxt-og-image and @nuxtjs/tailwindcss in the nuxi effects section below.

**Stale-flagged packages (installed 1+ year old)** — All six are already at latest stable within their major version. The flag reflects release age, not that we're behind. resvg-js (2.6.2), resvg-wasm (2.6.2), fast-glob (3.3.3, used directly in seal.js for wrapper manifest), is-mobile (5.0.0), qrcode (1.5.4), serverless-offline (14.4.0).

**Major version bumps available (ecosystem-gated, not actionable now):**
- h3 1→2 — scoped to Nuxt 5, not Nuxt 4. We abstracted h3 access behind four `getWorker*` functions in icarus/level2.js for this eventual migration.
- vite 6→7 — Nuxt 4 uses vite 6 internally. icarus and oauth declare vite 6 directly and should stay aligned.
- vue-router 4→5 — Nuxt manages this dependency.
- @vitejs/plugin-vue 5→6 — in icarus, needs to match vite version.
- @sveltejs/vite-plugin-svelte 5→6 — in oauth, svelte ecosystem change.


## nuxi effects

scaffolded fresh 2026feb3, nuxi add brought in these peer dependencies:

$ pnpm dlx nuxi@latest module add pinia
```diff
 	"dependencies": {
+		"@pinia/nuxt": "0.11.3",
+		"pinia": "^3.0.4",
 		"vue": "^3.5.27",
 		"vue-router": "^4.6.4"
 	},
```

$ pnpm dlx nuxi@latest module add og-image
```diff
 	"dependencies": {
 		"@pinia/nuxt": "0.11.3",
+		"nuxt-og-image": "5.1.13",
+		"@unhead/vue": "^2.1.2",
+		"unstorage": "^1.17.4",
 		"vue": "^3.5.27",
 		"vue-router": "^4.6.4"
 	},
```

$ pnpm dlx nuxi@latest module add tailwindcss
$ pnpm add vidstack@next
```diff
 	"dependencies": {
+		"@nuxtjs/tailwindcss": "6.14.0",
+		"vidstack": "^1.12.13",
 		"@pinia/nuxt": "0.11.3",
 		"@unhead/vue": "^2.1.2",
 		"nuxt": "^4.3.0",
```

$ pnpm why tailwindcss > 4tailwind.txt
```
Legend: production dependency, optional only, dev only

fresh-today ~/Documents/code/temp/fresh-today (PRIVATE)

dependencies:
@nuxtjs/tailwindcss 6.14.0
├─┬ tailwind-config-viewer 2.0.4
│ └── tailwindcss 3.4.19 peer
└── tailwindcss 3.4.19
```

So we get **tailwindcss 3.4.19** as a transitive dependency of `@nuxtjs/tailwindcss` (which appears in our package.json, and is at version 6). You don't declare `tailwindcss` directly in package.json — the Nuxt module brings it in. This means we're on Tailwind 3.x, not Tailwind 4.x. Tailwind 4 is a major rewrite with CSS-first configuration — a separate migration if we ever want it.

