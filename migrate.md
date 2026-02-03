
## Upgrade Path: Nuxt 3 → Nuxt 4

The upgrade is designed to be incremental and low-risk. Here's the recommended approach:

### Phase 1: Test Compatibility (While Still on Nuxt 3)

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

This lets you identify breaking changes in your codebase before committing to the upgrade.

### Phase 2: Run the Codemod Recipe

To facilitate the upgrade process, the Nuxt team collaborated with the Codemod team to automate many migration steps with open-source codemods.

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

### Phase 3: Upgrade the Package

```bash
npx nuxi upgrade
```

Or manually update your `package.json` to `nuxt@^4.0.0` and reinstall.

### Key Breaking Changes to Review

**Directory Structure** (biggest visible change):

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

**Data Fetching** — shallow reactivity is now the default:

```ts
// If you relied on deep reactivity, opt back in per-call:
const { data } = useFetch('/api/test', { deep: true })
```

**TypeScript** — Nuxt 4 creates separate TS projects for app/server/shared contexts. This is probably the single issue most likely to cause surprises when upgrading, but it should also make your TypeScript experience much smoother in the long run.

### For Complex Projects

1. **Test first** — use `compatibilityVersion: 4` on a branch, run your test suite
2. **Run codemods selectively** — review what each codemod does before applying
3. **Check module compatibility** — some third-party modules may need updates
4. **Custom files** — the codemod won't move things like `locales/` or custom config directories; handle those manually
5. **Layers** — if you use Nuxt layers, each layer may need its own `compatibilityVersion` setting

Given your Cloudflare Workers deployment target, the upgrade shouldn't affect your deployment pipeline—the build output structure remains compatible.

## What `nitro-cloudflare-dev` does

When you run `nuxt dev`, Nitro spins up a local Node.js server. But Cloudflare Workers have their own runtime with bindings (KV, R2, D1, etc.) that don't exist in Node. Your code that accesses `event.context.cloudflare.env.OG_IMAGE_CACHE` would fail locally because that KV namespace doesn't exist in Node.

This module enables access to the Cloudflare runtime platform in the development server of Nitro and Nuxt using the `getPlatformProxy` API exposed by wrangler and miniflare.

It reads your `wrangler.jsonc`, spins up a local miniflare instance, and injects the emulated bindings into your request context so your server routes work locally the same way they do in production.

## Why it may not be needed anymore

Cloudflare preset can be enabled in development mode for production environment emulation and access to the bindings in local dev. In order to enable dev preset, make sure using latest nitro version (>=2.12) and install wrangler as a dependency.

Nitro 2.12+ has this built in natively. When you set the preset and have wrangler installed, you should see:

```
ℹ Using cloudflare-dev emulation in development mode.
```

The module's own README acknowledges this: Nitro plans to introduce a new method to allow native dev presets, meaning you can natively run miniflare as your development server without this module or a proxy in the future!

## How to test removing it

1. Check your Nitro version (Nuxt 3.12+ ships with Nitro 2.12+)

2. Remove the module from your config:
   ```js
   // configuration.modules.push('nitro-cloudflare-dev')  // comment out
   ```

3. Make sure wrangler is a dev dependency (you already have it)

4. Run `nuxt dev`

5. Look for the "Using cloudflare-dev emulation" message

6. Test that your KV binding still works—specifically, that `nuxt-og-image` can still write to `OG_IMAGE_CACHE` during local dev

If it works, uninstall the package. If not, check that your `compatibilityDate` is recent enough and that your preset is explicitly set. Your config already has both:

```js
configuration.compatibilityDate = '2025-06-10'
configuration.nitro = { preset: 'cloudflare_module', ... }
```

So in theory you should be fine. The native support landed because enough people were using that module that Nitro just absorbed the functionality.









