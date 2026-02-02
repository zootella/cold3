# pnpm Migration Notes

Migration plan from Yarn Classic (1.22.22) to pnpm (10.28.2).

pnpm installed via corepack:
```
corepack enable
corepack prepare pnpm@latest --activate
```

## The Easy Parts

**1. Lockfile conversion** - pnpm can import directly from yarn.lock:
```bash
pnpm import   # creates pnpm-lock.yaml from yarn.lock
```

**2. Workspaces** - pnpm reads the same `workspaces` field in package.json, or you can create `pnpm-workspace.yaml`. Current setup should work as-is.

**3. packageManager field** - just change it:
```json
"packageManager": "pnpm@10.28.2"
```

**4. Scripts** - all npm scripts work identically.

**5. Workspace dependencies** - pnpm understands `"icarus": "*"` but prefers `"icarus": "workspace:*"`. Works either way, but the explicit protocol is cleaner.

## Likely Problem Areas

**1. `net23/build.js`** - stays isolated, keeps using plain npm for Lambda builds. No changes needed.

**2. Hoisting behavior** - pnpm is stricter by default. Packages can't access dependencies they don't explicitly declare. If any code does `require('some-transitive-dep')`, it breaks. This is actually a *good* thing but might surface hidden bugs.

**3. Peer dependency handling** - pnpm auto-installs missing peer deps (good), but errors on version conflicts (may need `.npmrc` to relax).

### Peer Dependency Example: pino-pretty

Currently in `site/package.json` we have:
```js
"pino-pretty": "^13.1.1",//added to fix build error caused by wagmi connectors bringing in walletconnect and wanting pino
```

The actual dependency chain (traced with `yarn why`):
```
site4
  → @wagmi/connectors
    → @walletconnect/ethereum-provider
      → @walletconnect/sign-client
        → @walletconnect/logger
          → pino (has pino-pretty as peer dep)
```

**What happened with Yarn Classic:**
- Yarn classic does **not** auto-install peer deps
- Yarn classic does **not** warn loudly (or at all) about missing peers
- Result: `yarn install` succeeds silently → build fails later with confusing error → debug → figure out pino-pretty is needed → manually add to package.json

This leads to accumulating "unexplained dependencies" - months later, package.json has entries like `pino-pretty` and you're wondering "why is this here? I never use it directly."

**What happens with pnpm (with `auto-install-peers=true`, the default):**
- pnpm auto-installs pino-pretty without adding it to package.json
- It appears in `node_modules` and `pnpm-lock.yaml`, but not in your dependencies
- No clutter, no mystery entries

**Migration cleanup:** After switching to pnpm, `pino-pretty` can be **removed** from `site/package.json` - pnpm handles it automatically.

### Why Peer Deps "Crop Up" with Yarn Classic

Yarn Classic v1 does [not auto-install peer dependencies](https://github.com/yarnpkg/yarn/issues/1503) - this has been an open feature request since 2016. pnpm v8+ [defaults to `auto-install-peers=true`](https://github.com/orgs/pnpm/discussions/3995).

So projects using pnpm from the start have a different experience with *simple* missing peer deps - pnpm auto-installs them, no manual fix needed. We only know about pino-pretty *because* yarn classic forced us to discover and fix it manually.

**Nuances:**
- pnpm still prints output when auto-installing, so it's not completely invisible
- Version conflicts (e.g., package A wants `react@^16`, package B wants `react@^17`) are NOT auto-resolved - pnpm prints a warning and you must resolve manually
- Auto-installed peers are accessible to the package that declared them, but [not always to your own code directly](https://github.com/pnpm/pnpm/issues/8463)

Still, for simple cases like pino-pretty, pnpm handles it automatically while yarn classic requires: error → exploration → manual fix → clutter.

### Peer Dependency Settings in `.npmrc`

| auto-install-peers | strict-peer-dependencies | Behavior |
|---|---|---|
| `true` | `true` | Auto-install peers, error on conflicts. **pnpm default.** |
| `true` | `false` | Auto-install peers, warn on conflicts. **Monorepo best practice.** |
| `false` | `true` | Manual add required, error if missing. Strictest. |
| `false` | `false` | Manual add required, warn only. Unusual. |

With no `.npmrc`, you get the default (`true`/`true`). Try the migration with defaults first - if `pnpm install` succeeds, you're done.

If you hit peer dep conflicts that block install, create `.npmrc` at project root:
```ini
auto-install-peers=true
strict-peer-dependencies=false
```

Why `strict=false` for monorepos: complex dependency trees with multiple frameworks (Nuxt, SvelteKit, Vite, etc.) often have transitive peer dep conflicts that aren't actual problems. Warnings let you know; errors block your install.

## Dependency Areas

### AWS / Twilio / SendGrid (net23)

All in `net23/package.json`, used in Lambda via `persephone.js`. These stay isolated - `net23/build.js` uses plain npm to build `dist/` with the right native binaries for Amazon Linux arm64. No pnpm interaction.

- `@aws-sdk/*` - dev deps for local dev only (Lambda runtime has them)
- `@sendgrid/mail` - production dep, goes into Lambda bundle
- `twilio` - production dep, goes into Lambda bundle
- `sharp` - native module, npm handles cross-compilation

**pnpm impact:** None. Isolated build.

### viem / wagmi (site)

Ethereum blockchain integration. This is where the pino-pretty issue came from.

```
@wagmi/connectors → @walletconnect/* → pino → pino-pretty (peer dep)
```

Current peer dep workarounds in `site/package.json`:
- `pino-pretty` - **can remove**, pnpm auto-installs
- `@tanstack/vue-query` - noted as "peer dependency of wagmi vue" but also used directly in code; **keep it**

**pnpm impact:** Remove pino-pretty after migration.

### nuxt-og-image (site) - Most Troublesome Module

Dynamic OG image generation for social cards. This module has required the most maintenance due to version instability and heavy dependencies designed for both serverless and traditional Node environments.

#### Current Configuration

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

#### Usage

Uses built-in `NuxtSeo` component in two places:
- `site/pages/index.vue` - static home card
- `site/pages/card/[more].vue` - dynamic cards per route

No custom OG image components. First generation ~1500ms, cached requests much faster.

#### Version History (Why It's Troublesome)

**Declared as `^5.1.6`** in package.json, but lockfile resolves to `5.1.12`. This is NOT an exact pin - the caret range allows up to 5.x.x, meaning a fresh install or `upgrade-wash` could pull 5.1.13 (which breaks).

| Date | Change | Reason |
|------|--------|--------|
| Mar 2025 | v3 → v5 | unenv compatibility error |
| Dec 2025 | Lockfile at 5.1.12 | v5.1.13 broke the build |

The v5.1.13 breakage was related to a satori upgrade (0.15 → 0.18). The lockfile currently protects against this, but true defensive pinning would require changing package.json to `"nuxt-og-image": "5.1.12"` (no caret).

#### Heavy Transitive Dependencies

nuxt-og-image brings in a lot:

| Dependency | Size | Purpose |
|------------|------|---------|
| `playwright-core` | 3MB+ | Browser automation (not used on Workers) |
| `satori` | - | HTML/CSS → SVG conversion |
| `@resvg/resvg-wasm` | - | SVG → PNG via WASM (used on Workers) |
| `yoga-wasm-web` | - | CSS layout engine for satori |
| `chrome-launcher` | - | Headless Chrome fallback |
| Inter font files | 550KB each | Embedded fonts for rendering |

On Cloudflare Workers, only the WASM path is used (no browser). But playwright-core still gets installed.

#### Companion Dependencies

The `nuxi module add og-image` command added three packages to `site/package.json`:

- `nuxt-og-image` - the actual module, **keep** (consider exact pin to avoid 5.1.13)
- `@unhead/vue` - also brought in by nuxt itself, **possibly removable**
- `unstorage` - also brought in by nitropack/nuxt/walletconnect, **possibly removable**

#### Cache Invalidation

When `defineOgImageComponent` properties change, old cached images persist until TTL expires (20 min). Force regeneration with:
```
https://domain/__og-image__/image/og.png?purge
```

#### pnpm Migration Concerns

1. **Lockfile protection must be preserved** - currently at `5.1.12`, but package.json says `^5.1.6`
2. **Complex dependency tree** - may surface peer dep conflicts with satori/yoga/resvg chain
3. **@unhead/vue and unstorage** - test removing after migration (nuxt brings them anyway)
4. **Watch for WASM loading issues** - pnpm's stricter module resolution could affect how resvg-wasm loads

**Recommendation:** Test `site` workspace carefully after pnpm migration. This is the highest-risk module.

### vidstack (site)

Video player component. No noted issues. Modern ESM package.

**pnpm impact:** Should work fine.

### Uppy (site)

File upload to S3 via presigned URLs.

- `@uppy/core` - orchestrator
- `@uppy/dashboard` - UI
- `@uppy/aws-s3` - S3 destination plugin

All three are explicit dependencies used directly in code. No peer dep workarounds.

**pnpm impact:** Should work fine.

### h3 / ofetch (icarus)

These are intentionally in `icarus/package.json`:
```js
"h3": "^1.13.0",
"ofetch": "^1.4.1",//nuxt brings in these two; added them to icarus so code can use them directly in icarus for lambda
```

Nuxt brings them in for site, but icarus needs them explicitly so Lambda code (which doesn't have Nuxt) can use them. **Keep these.**

**pnpm impact:** None. Intentional dependencies, not workarounds.

## Migration Steps

```bash
# 1. From project root
pnpm import                    # convert yarn.lock → pnpm-lock.yaml

# 2. Update root package.json
#    "packageManager": "pnpm@10.28.2"

# 3. Install
pnpm install

# 4. Test each workspace
pnpm --filter icarus run build
pnpm --filter site run local
pnpm --filter oauth run local
pnpm --filter net23 run local
```

## Recommended Approach

1. **Try it in a branch** - the import is non-destructive
2. **Test each workspace** - Vite/Nuxt/SvelteKit all handle pnpm well

## TODO

- [x] Review `net23/build.js` - keep using npm there, it's isolated
- [x] Understand peer dep behavior - defaults are good, `.npmrc` only if needed
- [x] Audit dependency areas - see above
- [ ] Run `pnpm import` to test lockfile conversion
- [ ] Run `pnpm install` (try with defaults first, add `.npmrc` if conflicts block)
- [ ] Test each workspace with pnpm
- [ ] Cleanup after successful migration:
  - [ ] Remove `pino-pretty` from `site/package.json` (pnpm auto-installs)
  - [ ] Test removing `@unhead/vue` from `site/package.json` (nuxt brings it)
  - [ ] Test removing `unstorage` from `site/package.json` (nitropack/nuxt bring it)

# Additional Notes

first section about wash and upgrade-wash, and the "right way" to do that:

# Semver Range Resolution and Upgrade Strategies

## Semver Caret Ranges

`"^1.1.1"` means `>=1.1.1 <2.0.0`. It locks the leftmost non-zero digit and allows everything else to float. When the major version is `0`, the caret gets tighter: `^0.2.3` means `>=0.2.3 <0.3.0`.

Yarn Classic and pnpm interpret caret ranges identically — they both use the `node-semver` library. The differences between package managers are in how they store and link resolved versions, not in how they evaluate ranges.

## What Installs vs. What package.json Says

When you install with a lockfile present, you get whatever the lockfile pins. When you install without a lockfile (fresh clone, or after deleting it), the package manager resolves every range against the current registry and writes a new lockfile.

Critically, none of the standard install or update workflows change the version numbers in `package.json` by default. If your `package.json` says `"^1.1.1"` and you resolve to `1.5.5`, your `package.json` still says `"^1.1.1"` afterward. This means the semver floor stays at 1.1.1 even though your project has never actually been tested against anything older than 1.5.5.

By contrast, scaffolding a project from scratch (e.g. `nuxt init`, `create-svelte`) writes whatever is latest at scaffolding time into `package.json`, so you'd get `"^1.5.5"` — same installed version, but a higher floor.

## Upgrade Commands

### yarn upgrade / pnpm update

These re-resolve all ranges against the registry, equivalent to deleting `node_modules` and the lockfile and reinstalling. The lockfile gets updated, `node_modules` gets updated, but `package.json` is untouched.

`"^1.1.1"` in package.json → 1.5.5 installed → package.json still reads `"^1.1.1"`

### yarn upgrade --latest / pnpm update --latest

These update both the lockfile and `package.json`, but they ignore your current semver range entirely. If v2.3.0 is the latest, you'll jump from `"^1.1.1"` to `"^2.3.0"`. Useful when you want to move to the latest of everything regardless of major version boundaries.

### npm-check-updates (ncu)

`ncu` is the standard tool for controlled `package.json` bumps. It updates the version numbers in `package.json` without installing anything — you run `install` afterward.

```bash
npx npm-check-updates -u --target <target>
```

Targets:

- `--target semver` — Raise the floor to the highest version your current range already allows. `"^1.1.1"` becomes `"^1.5.5"` if 1.5.5 is the latest within `>=1.1.1 <2.0.0`. This doesn't change what gets installed — it just makes `package.json` reflect what you're actually resolving to. This is the automated equivalent of re-scaffolding the project from scratch.
- `--target minor` — Update to the latest version within the same major. Functionally similar to `--target semver` when you're using caret ranges on major >= 1, but the distinction matters for `~` (tilde) ranges or `0.x` versions.
- `--target patch` — Stay within the same major.minor. `"^1.1.1"` could become `"^1.1.9"` but not `"^1.2.0"`.
- `--target latest` (default) — Unconstrained. Same behavior as `yarn upgrade --latest` / `pnpm update --latest`. Will cross major version boundaries.

### Typical Workflow

To bump floors while staying within current semver ranges:

```bash
npx npm-check-updates -u --target semver
yarn install   # or pnpm install
```

This results in the same installed versions as `yarn upgrade` / `pnpm update`, but with `package.json` updated to reflect the actual resolved versions — keeping the floor honest.

## Checking Actual Installed Versions

Use `yarn why <package>` (or `pnpm why <package>` after migration) to see what's actually installed vs. what package.json declares. This is essential in a monorepo where the same package may appear multiple times at different versions.

### Example Investigation (Feb 2026)

Four packages across the monorepo, checking package.json ranges vs. actual installed versions:

| Package | package.json | Installed | Other versions in tree |
|---------|--------------|-----------|----------------------|
| **zod** | `^3.25.74` | 3.25.76 | Also: 3.22.3 (miniflare), **4.1.12** (porto!), 3.22.4 (@reown) |
| **wrangler** | `^4.20.0` | 4.45.2 | Single version |
| **viem** | `^2.37.3` | 2.38.5 | Also: 2.23.2 (walletconnect's own copy) |
| **nuxt-og-image** | `^5.1.6` | 5.1.12 | Single version |

### Sample Output

**zod** - multiple versions, including a major version jump in transitive deps:
```
$ yarn why zod
info => Found "zod@3.25.76"
info Reasons this module exists
   - "_project_#icarus" depends on it
   - Hoisted from "_project_#icarus#zod"

info => Found "miniflare#zod@3.22.3"
info This module exists because "_project_#oauth#wrangler#miniflare" depends on it.

info => Found "porto#zod@4.1.12"
info This module exists because "_project_#site4#@wagmi#connectors#porto" depends on it.

info => Found "@reown/appkit-wallet#zod@3.22.4"
info This module exists because "_project_#site4#@wagmi#connectors#@walletconnect#ethereum-provider#@reown#appkit#@reown#appkit-wallet" depends on it.
```

**wrangler** - single version, significant drift from package.json floor:
```
$ yarn why wrangler
info => Found "wrangler@4.45.2"
info Reasons this module exists
   - "_project_#oauth" depends on it
   - Hoisted from "_project_#oauth#wrangler"
   - Hoisted from "_project_#site4#wrangler"
```

**viem** - two versions, walletconnect bundles its own older copy:
```
$ yarn why viem
info => Found "viem@2.38.5"
info Reasons this module exists
   - Hoisted from "_project_#icarus#viem"
   - Hoisted from "_project_#site4#viem"
   - Hoisted from "_project_#site4#@wagmi#connectors#...many paths...

info => Found "@walletconnect/utils#viem@2.23.2"
info This module exists because "_project_#@walletconnect#utils" depends on it.
```

### Key Insights

1. **Multiple versions are normal** - transitive deps often bundle their own versions
2. **Major version jumps can hide in the tree** - zod 4.x appeared via wagmi→porto even though we declare 3.x
3. **Significant drift from package.json** - wrangler jumped 25 minor versions (4.20 → 4.45)
4. **Some packages isolate themselves** - walletconnect bundles its own viem 2.23.2

### pnpm Equivalent

After migration, use `pnpm why <package>` for the same information.

## Four Versions of Every Package

For any package in your dependency tree, there are four version numbers worth knowing:

| Version | What it is | How to find it |
|---------|------------|----------------|
| **Declared** | The semver range in package.json | Read package.json |
| **Installed** | What's actually in node_modules/lockfile | `yarn why <pkg>` or `pnpm why <pkg>` |
| **Latest in range** | What a fresh install would get | `npm view <pkg>@"<range>" version \| tail -1` |
| **Latest on npm** | Absolute newest, ignoring your range | `npm view <pkg> version` |

### Example: Four Packages (Feb 2026)

| Package | Declared | Installed | Latest in range | Latest on npm |
|---------|----------|-----------|-----------------|---------------|
| **zod** | `^3.25.74` | 3.25.76 | 3.25.76 | **4.3.6** (major!) |
| **wrangler** | `^4.20.0` | 4.45.2 | **4.61.1** | 4.61.1 |
| **viem** | `^2.37.3` | 2.38.5 | **2.45.1** | 2.45.1 |
| **nuxt-og-image** | `^5.1.6` | 5.1.12 | **5.1.13** | 5.1.13 |

### Quick Reference

```bash
# 1. What does package.json say?
grep <package> package.json

# 2. What's actually installed?
yarn why <package>          # or: pnpm why <package>

# 3. What would fresh install get (within my semver range)?
npm view <package>@"^x.y.z" version | tail -1

# 4. What's the absolute latest on npm?
npm view <package> version
```

### Why This Matters

- **Installed vs Latest in range**: Your lockfile may be protecting you (nuxt-og-image 5.1.12 vs 5.1.13 which breaks)
- **Latest in range vs Latest on npm**: Shows if a major version exists you might want to upgrade to (zod 4.x)
- **New teammate risk**: Without lockfile committed, they get "Latest in range" - may differ from your "Installed"
