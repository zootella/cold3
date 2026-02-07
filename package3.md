
# Major Version Upgrade Evaluation

## Context

After the big migration (yarn to pnpm, Nuxt 3 to 4, og-image 5 to 6, tailwind 3 to 4), the monorepo is in a clean state: upgrade-wash produces a working build, declared versions match installed, and the lockfile is no longer load-bearing. This is the right time to evaluate which major version bumps are worth pursuing and which can wait.

Not every major bump is worth chasing. The question is whether the distance between where we are and where the module has gone creates real cost — in maintenance burden, ecosystem friction, or missed improvements. An upgrade is compelling when staying behind is actively costing us something:

- **Staleness.** If the version we're running is many months old and the project has moved on significantly, we're accumulating distance. The longer we wait, the harder the eventual jump. A module that ships majors infrequently (every 1-2 years) is signaling each one is intentional — being a full cycle behind matters more than for a project that cuts majors every few months.
- **Better internals.** The new version brings meaningful improvements: smaller dependency tree, better tree-shaking, modern JS patterns (ESM-only, dropping CJS shims), improved compatibility with our build tooling (Rollup, Vite, Nitro), or performance gains that matter for our use case.
- **Dependency tree cleanup.** The old major pulls in transitive deps that are deprecated, unmaintained, or have known vulnerabilities. The new major drops them. Especially compelling when those transitive deps are what's causing lockfile friction.
- **Ecosystem alignment.** The rest of our stack has moved to expect the new version — Nuxt expecting h3 v2, Vite 7 expecting plugin-vue 6. Staying behind creates peer dep tension and blocks future upgrades of the things that depend on it.

On the other hand, a major version bump on npm doesn't obligate us to do anything. If the code works, the module is stable in our usage, and the new major doesn't unlock something we need, it's fine to let it sit. Reasons to defer:

- **It works and we don't need what's new.** The installed version works, our API surface is small, and the new major doesn't offer anything we need. dotenv 16 to 17 is the classic example — it loads .env files, it works, the bump is trivial but also trivially deferrable.
- **The new major is still prerelease.** h3 v2 is at rc.14 — it's not stable yet. Upgrading to an RC means signing up for more churn. Still worth investigating if the RC is close to stable and a future Nuxt version will require it.
- **Our usage is shallow.** If we only use a small slice of the module's API, the breaking changes may not affect us at all. But this has to be verified by checking actual imports and usage, not assumed.
- **Coupled upgrades.** wagmi/connectors 7 and wagmi/core 3 likely need to move together, and may require viem changes. Vite 7 may require plugin-vue 6 and vite-plugin-svelte 6. These coupled upgrades are bigger projects and should be evaluated as a group, not individually.

For each candidate that seems worth investigating, these are the dimensions to check. The goal is to get from "there's a new major" to either "do it", "do it as part of a group", or "not now" as efficiently as possible:

- **Release history.** When was our installed major first released? When did the new major ship? How many majors in the last 3 years? This tells you the cadence and how urgent it is to keep up.
- **Changelog.** What actually changed? API removals, renamed exports, dropped Node version support, new required peer deps, or a fundamental architecture shift? The answer determines the upgrade effort.
- **Our usage surface.** Grep the codebase for all imports from this module. How many files, how many distinct APIs? A module imported in 2 files with 3 function calls is a different upgrade than one woven through 40 files.
- **Dependency tree impact.** Compare the transitive dependency trees of the old and new versions. Does the new version drop heavy or outdated sub-deps? Does it shrink the install footprint?
- **Coupled upgrades.** Does this module's new major require or enable upgrades of other modules on the list? Map the dependency chains to find upgrade groups that should move together.
- **Effort estimate.** Based on the above: is this a one-line version bump, a half-day of API changes, or a multi-day project? What's the risk of subtle runtime breakage that tests might not catch?

## Nuxt framework

These four are all constrained by Nuxt — we use them, but we don't control their versions. h3 is the strongest case: it's literally bundled inside Nitro, so upgrading independently is impossible. The other three (vite, plugin-vue, vue-router) are declared as direct dependencies in our package.jsons, so we *could* technically bump them. But Nuxt's build pipeline, SFC compilation, and routing layer are built on top of all three. Vite 7 changes plugin APIs that Nuxt's internal Vite config depends on. plugin-vue v6 is loaded through Nuxt's own Vite pipeline — bumping it without Nuxt expecting it risks conflicts. vue-router 5 is a major rewrite that Nuxt's entire routing abstraction (`useRouter()`, `<NuxtLink>`, file-based routing, middleware) would need to explicitly adopt. Upgrading any of these before Nuxt officially supports the new version is swimming upstream. These all move when Nuxt moves.

### h3 (hold)

```yaml
h3:
  homepage: https://h3.dev
  description: Minimal H(TTP) framework built for high performance and portability.
  from: icarus
  versions:
    declared: ^1.15.5
    installed: 1.15.5 on 2026jan15 1m old
    current: 1.15.5 on 2026jan15 1m old
    latest: 2.0.1-rc.14 on 2026feb05 0m old 🎁 Major new version available
  downloads:
    weekly: 4,159,531
```

h3 v2 is a ground-up rewrite (web standards replacing Node.js primitives, dependency tree from 9 packages to 2, bundle from ~40 KB to ~4 KB, sweeping API renames), still in RC (14 RCs since October 2024). Nuxt 4 ships h3 v1 via Nitro 2.x; h3 v2 arrives with Nitro v3, which ships with Nuxt 5. Our direct usage in `icarus/level2.js` is two imports (`getQuery`, `readBody`) wrapped behind four `getWorker*` abstraction functions (lines 969–976) that feed `doorWorkerOpen()`, the single entry point for all 18 API routes. Nitro auto-imports (`defineEventHandler`, `getCookie`/`setCookie`, `setResponseStatus`) are Nitro's globals, not our direct h3 calls. The abstraction layer is already in place for when Nuxt 5 brings h3 v2.

### vite (hold)

```yaml
vite:
  homepage: https://vite.dev
  description: Native-ESM powered web dev build tool
  from:
    - icarus
    - oauth
  versions:
    declared: ^6.4.1
    installed: 6.4.1 on 2025oct20 4m old
    current: 6.4.1 on 2025oct20 4m old
    latest: 7.3.1 on 2026jan07 1m old 🎁 Major new version available
  downloads:
    weekly: 53,611,431
```

### @vitejs/plugin-vue (hold)

```yaml
"@vitejs/plugin-vue":
  homepage: https://github.com/vitejs/vite-plugin-vue/tree/main/packages/plugin-vue#readme
  description: The official plugin for Vue SFC support in Vite.
  from: icarus
  versions:
    declared: ^5.2.4
    installed: 5.2.4 on 2025may09 9m old
    current: 5.2.4 on 2025may09 9m old
    latest: 6.0.4 on 2026feb02 0m old 🎁 Major new version available
  downloads:
    weekly: 4,786,123
```

### vue-router (hold)

```yaml
vue-router:
  homepage: https://router.vuejs.org
  description: Vue Router 4 for Vue 3
  from:
    - icarus
    - site
  versions:
    declared: ^4.6.4
    installed: 4.6.4 on 2025dec11 2m old
    current: 4.6.4 on 2025dec11 2m old
    latest: 5.0.2 on 2026feb02 0m old 🎁 Major new version available
  downloads:
    weekly: 4,742,858
```

## SvelteKit ecosystem

The oauth workspace is a minimal SvelteKit app (2 pages, ~180 lines of logic) that exists solely to bridge Auth.js OAuth flows back to the Nuxt site via encrypted envelope handoff.

### @sveltejs/vite-plugin-svelte (hold)

```yaml
"@sveltejs/vite-plugin-svelte":
  homepage: https://github.com/sveltejs/vite-plugin-svelte#readme
  description: The official Svelte plugin for Vite.
  from: oauth
  versions:
    declared: ^5.1.1
    installed: 5.1.1 on 2025jul11 7m old
    current: 5.1.1 on 2025jul11 7m old
    latest: 6.2.4 on 2026jan09 1m old 🎁 Major new version available
  downloads:
    weekly: 1,245,973
```

**Not now — majors too frequent to chase.** The major version cadence here is fast (v4 Oct 2024, v5 Nov 2024, v6 Jul 2025, v7-next already exists) — each just tracks a Vite major, averaging a new one every 4–5 months. Upgrading now would clear the flag for a few months before the next major lands. The oauth workspace is minimal (2 pages, ~180 lines of logic, just an Auth.js OAuth bridge), the v6 breaking changes don't touch our usage (no TS, no custom transforms, already ESM, Vite 6.4 satisfies the peer dep), and v5 works fine. Not worth the churn of perpetually chasing a fast-moving major version number that signals mechanical peer dep bumps, not meaningful architectural changes.
