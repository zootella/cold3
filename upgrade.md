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

### @sveltejs/adapter-auto (remove)

```yaml
"@sveltejs/adapter-auto":
  homepage: https://svelte.dev/docs/kit/adapter-auto
  description: Automatically chooses the SvelteKit adapter for your current environment, if possible.
  from: oauth
  versions:
    declared: ^6.1.1
    installed: 6.1.1 on 2025oct02 4m old
    current: 6.1.1 on 2025oct02 4m old
    latest: 7.0.0 on 2025oct16 4m old 🎁 Major new version available
  downloads:
    weekly: 372,936
```

**Remove, don't upgrade.** `svelte.config.js` imports `@sveltejs/adapter-cloudflare` directly — adapter-auto is listed in `oauth/package.json` devDependencies but never imported anywhere. Dead weight, same situation as @tanstack/vue-query in site. The major cadence is even faster than vite-plugin-svelte (v5 to v6 was 13 days), each bump just tracking whichever underlying adapter crossed a major. Moot anyway since it should be removed.

When we do this, also remove `nitro-cloudflare-dev` from `site/package.json` at the same time. Same pattern — a deprecated Cloudflare dev shim that Nitro 2.12+ replaced with native emulation. That one's still wired into `site/nuxt.config.js` line 38 so it needs a test (steps already in package2.md), but both are vestigial Cloudflare convenience packages worth cleaning out together.

## web3

The wagmi packages (connectors and core) are from the same wevm project and ship as a coordinated set. Both are used in icarus and site. viem is their underlying transport layer and stays at ^2.x — no viem major bump is involved.

### @wagmi/connectors (upgrade)

```yaml
"@wagmi/connectors":
  homepage: https://github.com/wevm/wagmi#readme
  description: Collection of connectors for Wagmi
  from:
    - icarus
    - site
  versions:
    declared: ^5.11.2
    installed: 5.11.2 on 2025sep25 4m old
    current: 5.11.2 on 2025sep25 4m old
    latest: 7.1.6 on 2026feb01 0m old 🎁 Major new version available
  downloads:
    weekly: 508,960
```

### @wagmi/core (upgrade)

```yaml
"@wagmi/core":
  homepage: https://github.com/wevm/wagmi#readme
  description: VanillaJS library for Ethereum
  from:
    - icarus
    - site
  versions:
    declared: ^2.22.1
    installed: 2.22.1 on 2025oct14 4m old
    current: 2.22.1 on 2025oct14 4m old
    latest: 3.3.2 on 2026feb01 0m old 🎁 Major new version available
  downloads:
    weekly: 485,845
```

The actual breaking changes are small. Connectors v5→v6 was a ghost bump (zero API changes, just a peer dep pin). v6→v7's single change is that connector SDK dependencies were unbundled from the package into optional peer deps — we'd need to explicitly install `@walletconnect/ethereum-provider` since we use `walletConnect()`. Core v2→v3 renames three functions: `getAccount`→`getConnection`, `watchAccount`→`watchConnection`, `switchAccount`→`switchConnection`, and adds `ox` as a peer dep (already satisfied transitively by viem 2.45.1). Everything else we use (`createConfig`, `reconnect`, `connect`, `disconnect`, `getBlockNumber`, `readContract`, `signMessage`, `getConnectors`) is unchanged. viem stays at ^2.x, no change needed.

Our usage is contained in three files: `icarus/level1.js` (dynamic import function `wevmDynamicImport()`, address validation with `viem.getAddress()`, mnemonic generation), `site/app/components/snippet1/WalletDemo.vue` (the wallet UI — 2 connectors, 10 core functions, all loaded dynamically via `import.meta.client`), and `site/server/api/wallet.js` (server-side `verifyMessage()` for wallet proof). The code changes would be renaming `getAccount` to `getConnection` in ~5 places in WalletDemo.vue, renaming `watchAccount` to `watchConnection` in 1 place, and adding `@walletconnect/ethereum-provider` to both `icarus/package.json` and `site/package.json`.

**Do it.** ~20 minutes of mechanical renames buys 12+ months of being current — core v2 ran for 26 months before v3, and v3 looks like it's settling into another long stable run with no v4 or connectors v8 on the horizon. Unlike vite-plugin-svelte's 4–5 month churn, this project holds majors for years. Being on v3/v7 now means when the web3 user stories come, we're already on current docs and examples and can focus on new functionality.

When doing the upgrade, two things to watch for. First, `@walletconnect/ethereum-provider` becomes an explicit dependency we manage — it's already in our tree (buried inside connectors v5's bundled deps) but v7 unbundles it, so we'll need to declare it in `icarus/package.json` and `site/package.json`. Second, core v3 adds `ox` as a peer dep. viem 2.45.1 pulls in ox@0.11.3 transitively, which should satisfy it, but pnpm can be strict about peer deps not being hoisted — may need to add `ox` explicitly if `pnpm install` complains.

## Independent

These modules don't have strong coupling to each other or to the groups above. Each can be evaluated and upgraded on its own timeline.

### zod (upgrade)

```yaml
zod:
  homepage: https://zod.dev
  description: TypeScript-first schema declaration and validation library with static type inference
  from: icarus
  versions:
    declared: ^3.25.76
    installed: 3.25.76 on 2025jul08 7m old
    current: 3.25.76 on 2025jul08 7m old
    latest: 4.3.6 on 2026jan22 0m old 🎁 Major new version available
  downloads:
    weekly: 87,621,926
```

**Do it — zero code changes required.** Our entire zod usage is a single schema in `icarus/level1.js`: `zod.string().email()` cached as a lazy singleton, called via `.safeParse()` three times in `validateEmail()` to check adjusted, presented, and normalized email forms. No other schemas, no `z.infer<>`, no complex compositions anywhere in the monorepo. In v4, `z.string().email()` is deprecated but still functional — the idiomatic replacement is `z.email()`, but there's no rush. The upgrade is literally changing `^3.25.76` to `^4.0.0` in `icarus/package.json`.

The v4 rewrite is real — sweeping API changes for heavy users (`.record()` requires two args, `.default()` behavior changed, error customization overhauled, TypeScript generics simplified) — but none of it touches our one-method usage. Zero runtime dependencies in both versions. Bundle drops from ~12.5 KB to ~5.4 KB gzipped, string parsing 14x faster. v4 also declares `"sideEffects": false` (v3 didn't), so Rollup/Vite can tree-shake aggressively. v3 ran for 4 years (2021–2025), v4 has been stable for 7 months with no v5 signals, and zod's subpath versioning guarantees `zod/v3` will exist forever if we ever needed to fall back. Easiest upgrade on the list.

Since zod lands in the default client bundle, also worth considering Zod Mini (`zod/mini`) — 1.88 KB gzipped vs 5.4 KB for full v4. Same schemas, same `.safeParse()`, but stripped-down error reporting (plain strings instead of structured `ZodError` objects). Our usage is binary — `validateEmail()` checks `.success` and returns the result object upstream on failure. If nothing downstream ever inspects zod's structured error messages (issue codes, paths, formatted output), Mini works and saves another 3x. Check whether callers of `validateEmail()`/`checkEmail()` look inside the `j1`/`j2`/`j3` error objects beyond the boolean.

### dotenv (remove)

```yaml
dotenv:
  homepage: https://github.com/motdotla/dotenv#readme
  description: Loads environment variables from .env file
  from: root
  versions:
    declared: ^16.6.1
    installed: 16.6.1 on 2025jun27 7m old
    current: 16.6.1 on 2025jun27 7m old
    latest: 17.2.4 on 2026feb05 0m old 🎁 Major new version available
  downloads:
    weekly: 89,667,593
```

**Don't upgrade — the "breaking change" is ads.** The sole difference between v16 and v17 is that the `quiet` option default flipped from `true` to `false`. In v16.6.0 the maintainer added a runtime log message to stdout that includes rotating promotional tips for dotenvx, his commercial product: `[dotenv@17.2.1] injecting env (0) from .env -- tip: encrypt with dotenvx: https://dotenvx.com`. v17 made this on by default. No API changes, no parsing changes, no security fixes. The community backlash was intense — the stdout spam broke Playwright XML reports, corrupted JSON-RPC streams in Claude Desktop/MCP servers, and polluted piped commands. The maintainer closed and locked multiple GitHub issues (#904, #909) from people objecting. A package with 89M weekly downloads being used as an advertising vehicle.

Our usage is three local dev scripts (`seal.js`, `test.js`, `cors.js`) that load `.env` into `process.env` — none of this ends up in bundled code. All three already pass `{quiet: true}`, so even if we did upgrade to v17 we'd see no ads. But there's no reason to: `^16.6.1` won't auto-upgrade to 17.x, there are no security vulnerabilities in v16, and the core functionality is unchanged.

Better path: drop dotenv entirely and use Node's built-in `process.loadEnvFile()` (experimental in Node 22, stable in 24 — we're on 22 and only moving forward). Three files to change (`seal.js`, `test.js`, `cors.js`), same pattern in each — remove the import and replace the config call:

```js
// remove: import dotenv from 'dotenv'
// remove: dotenv.config({quiet: true})
// add:
process.loadEnvFile()
```

Then `pnpm remove dotenv` from root package.json. One caveat: `process.loadEnvFile()` throws if `.env` doesn't exist (dotenv silently ignores), but these are local dev scripts where `.env` should always be present.

### @vercel/nft (upgrade)

```yaml
"@vercel/nft":
  homepage: https://github.com/vercel/nft#readme
  description: Node File Trace - file dependency tracing for Node.js applications.
  from: net23
  versions:
    declared: ^0.29.4
    installed: 0.29.4 on 2025may30 8m old 🐣 Pre-1.0 version installed
    current: 0.29.4 on 2025may30 8m old
    latest: 1.3.0 on 2026jan21 1m old 🎁 Major new version available
  downloads:
    weekly: 5,524,454
```

**Do it, but verify the trace output.** The 1.0 wasn't a rewrite, it was a stability declaration — the sole breaking change is Node minimum raised from >=18 to >=20 (we're on 22). The `nodeFileTrace()` API is completely unchanged, and our call in `net23/build.js` line 46 works identically on both versions. The upgrade also clears the 🐣 pre-1.0 flag (real semver guarantees), drops ~20 transitive dependencies via glob v13, and aligns with Nitro v2 which already depends on `@vercel/nft ^1.2.0`.

The risk isn't the API — it's the trace results. nft determines which files from `node_modules` go into the Lambda zip, and that zip working with sharp native binaries, Twilio, SendGrid, and the CJS/ESM mix in `build.js` has been hard-won (see `build.txt` for the history). The glob v13 change is internal, and 1.x adds `module-sync` export condition handling that could trace CJS/ESM boundaries differently. If nft includes fewer files or misses a transitive require, Lambda breaks in production. To verify: bump the version, run `build.js`, and diff the `fileList` output against a 0.29 run before deploying. If the file lists are equivalent, ship it. If they diverge, inspect what changed before proceeding.
