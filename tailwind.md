# Tailwind CSS: Migration and Reference

This document chronicles the migration from Tailwind v3 to v4, completed on the `migrate1` branch in February 2026.

## How styling works now

- **Tailwind v4** via `@tailwindcss/vite` — a Vite plugin, not a Nuxt module. Registered in `nuxt.config.js` alongside vidstack.
- **Global stylesheet** at `site/app/assets/css/style.css` — contains `@import "tailwindcss"`, `@plugin "@tailwindcss/forms"`, `@theme` (font overrides for sans and mono), `@layer base` (resets, link colors), and `@layer components` (shared classes like `.my-button`, `.my-link`, state classes).
- **No `tailwind.config.js`** — all configuration lives in CSS via `@theme` and `@plugin`.
- **Scoped styles** use `@reference "tailwindcss"` to resolve `@apply` with built-in Tailwind utilities. Custom font choices (like Roboto for the terms document) use plain `font-family` CSS instead of Tailwind utilities.
- **Fonts** arrive three ways: bundled woff2 files in `site/public/fonts/` (Diatype Rounded, Lemon Wide), Google Fonts CDN link in `nuxt.config.js` (Noto Sans, Noto Sans Mono, Roboto), and system fallback stacks at the tail of every font-family list.

## What changed from v3

- Replaced `@nuxtjs/tailwindcss` module (community, 306K downloads) with `tailwindcss` + `@tailwindcss/vite` (official, 47.8M + 6.6M downloads)
- `@tailwind base/components/utilities` directives became `@import "tailwindcss"`
- JS config file deleted; plugin and theme moved to CSS directives
- 9 utility renames across 4 files: `rounded` → `rounded-sm`, `outline-none` → `outline-hidden`, `flex-shrink-0` → `shrink-0`
- Added `@reference "tailwindcss"` to 9 Vue components with scoped `@apply`
- Removed custom named font utilities (`--font-roboto`, `--font-diatype`, `--font-lemon`) from `@theme`; one-off font choices use plain CSS
- Fixed pre-existing Google Fonts bug: CSS2 API URL had unsorted axis tuples returning HTTP 400; all three linked fonts were silently failing to load on production

---

# [1] Mainstream Use of Tailwind in new Nuxt Projects (Best Practices)

A new Nuxt 4 site created today gets Tailwind v4 via the Vite plugin directly. The `@nuxtjs/tailwindcss` module is a v3 wrapper and does not support v4; its v7 beta exists but is not stable. The official guidance from both tailwindcss.com and the Nuxt ecosystem is to skip the module entirely.

## Setup: what a fresh Nuxt 4 + Tailwind v4 project looks like

**Packages:**
```
tailwindcss         (v4, the framework itself)
@tailwindcss/vite   (Vite plugin, replaces the Nuxt module and PostCSS config)
@tailwindcss/forms  (still exists, still works, registration moves to CSS)
```

**nuxt.config.ts** -- Tailwind is a Vite plugin, not a Nuxt module:
```js
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  css: ['./app/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
})
```

No `@nuxtjs/tailwindcss` in modules. No PostCSS config file. No autoprefixer (Tailwind v4 handles it).

**main.css** -- single import replaces three directives:
```css
@import "tailwindcss";
```

**No tailwind.config.js.** Theme customization moves into CSS via `@theme`. Plugins register via `@plugin`. The JS config file is not auto-detected; it can be loaded via `@config "../../tailwind.config.js"` as a compatibility bridge, but this is not the recommended path.

## CSS-first configuration with @theme

All design tokens become CSS custom properties. Defining a variable in `@theme` simultaneously creates a CSS variable on `:root` and the corresponding utility classes:

```css
@import "tailwindcss";

@plugin "@tailwindcss/forms";

@theme {
  --font-sans: "Diatype Rounded", "Noto Sans", ui-sans-serif, system-ui, sans-serif,
    "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --font-mono: "Noto Sans Mono", ui-monospace, SFMono-Regular, Menlo, Monaco,
    Consolas, "Liberation Mono", "Courier New", monospace;
  --font-roboto: "Roboto", ui-sans-serif, system-ui, sans-serif;
  --font-lemon: "Lemon Wide", ui-sans-serif, system-ui, sans-serif;
  --color-brand: oklch(0.72 0.18 250);
}
```

This generates `font-sans`, `font-mono`, `font-roboto`, `font-lemon`, `text-brand`, `bg-brand`, etc. No JS spread syntax; you list full fallback stacks explicitly. By default `@theme` extends the defaults; use `--color-*: initial;` to clear a namespace first if you want to replace it entirely.

Theme values are CSS variables at runtime, accessible in JS via `getComputedStyle(document.documentElement).getPropertyValue('--font-sans')`. The v3 `resolveConfig()` function is removed.

## Directives that changed

| v3 | v4 | Notes |
|---|---|---|
| `@tailwind base;` `@tailwind components;` `@tailwind utilities;` | `@import "tailwindcss";` | Single import replaces all three |
| `tailwind.config.js` plugins array | `@plugin "@tailwindcss/forms";` | In CSS, after the import |
| `tailwind.config.js` theme.extend | `@theme { --font-sans: ...; }` | CSS custom properties |
| `@layer components { .foo { ... } }` | `@layer components { ... }` or `@utility foo { ... }` | `@layer` is now native CSS cascade layers; use `@utility` if you need Tailwind variant support (hover:, md:, etc.) |
| `theme(colors.red.500)` | `var(--color-red-500)` | CSS variables replace `theme()` function |
| `@config` (auto-detected) | `@config "path/to/config.js"` (explicit, compatibility only) | JS config is a bridge, not the path forward |

## @layer is now native CSS cascade layers

This is the biggest conceptual change. In v3, `@layer utilities` and `@layer components` were Tailwind-specific and gave classes inside them automatic variant support (hover, responsive, etc.). In v4, `@layer` is standard CSS `@layer` -- it controls cascade priority but does NOT give variant support.

For classes that need Tailwind variant support, use `@utility`:
```css
@utility tab-4 {
  tab-size: 4;
}
/* now tab-4, hover:tab-4, md:tab-4 all work */
```

For classes that are just plain CSS applied by name (like our `.my-button`, `.ghost`, etc.), `@layer components` still works fine -- we apply those classes directly, we don't use them with variants like `hover:my-button`.

## @apply in Vue scoped styles needs @reference

In v3, `@apply` in `<style scoped>` just worked because the Nuxt module wired everything up. In v4, scoped/isolated CSS is processed separately and can't resolve Tailwind classes without an explicit reference. The fix:

```vue
<style scoped>
@reference "tailwindcss";

.my-space {
  @apply flex flex-wrap items-baseline gap-2;
}
</style>
```

Or, if the component needs access to custom `@theme` values defined in the main CSS file:
```vue
<style scoped>
@reference "../../assets/css/style.css";
</style>
```

Every Vue component that uses `@apply` in a `<style>` block needs one of these lines added.

## Renamed and changed utilities

Scale shifts -- the "unnamed default" moved down one size. To keep the same visual appearance:

| v3 (what we write now) | v4 equivalent (same pixels) |
|---|---|
| `rounded` (0.25rem) | `rounded-sm` |
| `shadow` | `shadow-sm` |
| `blur` | `blur-sm` |
| `rounded-sm` | `rounded-xs` |
| `shadow-sm` | `shadow-xs` |
| `blur-sm` | `blur-xs` |

Other renames and behavior changes:

| v3 | v4 | Notes |
|---|---|---|
| `outline-none` | `outline-hidden` | `outline-none` now means `outline-style: none`, different behavior |
| `ring` (3px default) | `ring` (1px default) | Explicit `ring-2`, `ring-4` etc. are unchanged |
| bare `border` defaults to `gray-200` | bare `border` defaults to `currentColor` | Add explicit `border-gray-200` if you relied on the old default |
| `bg-opacity-50` | `bg-black/50` | Opacity modifiers replace standalone opacity utilities |
| `flex-grow` | `grow` | Old name removed |
| `flex-shrink` | `shrink` | Old name removed |

## Color palette

Colors keep the same names (slate, gray, zinc, neutral, stone, red, blue, etc.) but values shift from sRGB hex to OKLCH for wider P3 gamut. The visual difference is subtle but real -- colors may appear slightly more vivid on P3 displays.

## Plugins

`@tailwindcss/forms` works with v4, registered via `@plugin`:
```css
@plugin "@tailwindcss/forms";
```

With options:
```css
@plugin "@tailwindcss/forms" {
  strategy: class;
}
```

`@tailwindcss/container-queries` is now built into Tailwind v4 core -- no plugin needed.

## Browser requirements

Tailwind v4 requires Safari 16.4+, Chrome 111+, Firefox 128+. Uses `@property`, `color-mix()`, and CSS custom properties.

## Automated upgrade tool

```bash
npx @tailwindcss/upgrade
```

Requires Node.js 20+. Handles: updating dependencies, migrating `tailwind.config.js` to `@theme`, renaming utilities in templates, replacing `@tailwind` directives. Designed for standard setups; may not handle the Nuxt module config automatically, so some manual work is expected.





# [2] How Styling Works in the Site

This documents how the site workspace uses Tailwind CSS. The current setup is minimal, flexible, and the team is happy with it. This document captures the specifics so we can maintain that as the site evolves.

## Stack

| Piece | Version | Role |
|---|---|---|
| `@nuxtjs/tailwindcss` | 6.14.0 | Nuxt module; handles PostCSS config, purging, HMR automatically |
| Tailwind CSS | v3 (bundled by the module) | Utility-first CSS framework |
| `@tailwindcss/forms` | ^0.5.10 | Plugin; normalizes form controls to inherit site typography |

The module is registered in `site/nuxt.config.js`:

```js
configuration.modules.push('@nuxtjs/tailwindcss')
configuration.tailwindcss = {cssPath: '~/assets/css/style.css'}
```

No additional PostCSS config file is needed; the Nuxt module handles everything.

## tailwind.config.js

`site/tailwind.config.js` extends the default theme with fonts only. Nothing else is customized.

**Plugins:** `@tailwindcss/forms` (normalizes inputs, selects, textareas).

**Font families:**

| Utility class | Primary font | Source |
|---|---|---|
| `font-sans` (default) | Diatype Rounded | Local woff2 packaged in `/public/fonts/` |
| `font-mono` | Noto Sans Mono | Google Fonts link in `<head>` |
| `font-roboto` | Roboto | Google Fonts link in `<head>` |
| `font-diatype` | Diatype Rounded | Same local woff2 (named utility alias) |
| `font-lemon` | Lemon Wide | Local woff2 packaged in `/public/fonts/` |

Each stack falls through to `defaultTheme.fontFamily.sans` or `.mono` system fallbacks.

Google Fonts are loaded via a stylesheet `<link>` pushed onto `configuration.app.head.link` in `nuxt.config.js`. Weights loaded: 400 and 700 for Noto Sans and Noto Sans Mono; 400 and 500 for Roboto.

## style.css

`site/app/assets/css/style.css` is the single CSS entry point. It has three sections:

### 1. @font-face declarations (top of file)

Two local fonts declared before the Tailwind directives:

- **Diatype Rounded** (`ABCDiatypeRounded-Regular-Trial.woff2`, weight 400)
- **Lemon Wide** (`Lemon-Wide.woff2`, weight 400)

Both use `font-display: swap`.

### 2. Tailwind directives

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3. @layer base -- HTML element defaults

Sets global defaults using `@apply` so they participate in Tailwind's cascade:

| Selector | Styles |
|---|---|
| `html, body` | `bg-white text-gray-800 font-sans` |
| `.page-container` | `mx-auto max-w-screen-md p-4 pb-0` (centered column layout) |
| `pre, code` | `font-mono text-sm text-gray-400 font-bold` |
| `a` | `text-blue-600 underline` |
| `a:hover` | `text-blue-400` |
| `a:visited` | `text-purple-600` |
| `a:visited:hover` | `text-purple-400` |
| `a:active` | `text-red-800` |
| `button:disabled` | `cursor-default` |

### 4. @layer components -- Reusable visual classes

This layer defines two visual systems: **state classes** and **appearance classes**. They compose together.

**State classes** represent availability/activity:

| Class | Styles | Meaning |
|---|---|---|
| `.ghost` | `bg-gray-400` | Disabled, unavailable |
| `.ready` | `bg-green-600`, hover `bg-green-400` | Clickable, available |
| `.doing` | `bg-orange-500` | In progress, wait |

**Appearance classes** define what something looks like, independent of whether it's a `<button>`, `<a>`, or a Vue component:

`.my-button` -- looks like a push button:
```
inline-flex items-center text-white px-2 py-1 rounded cursor-pointer no-underline
```
- `:focus-visible` gets `outline-none ring-2 ring-blue-500 ring-offset-2`
- `a.my-button:visited` stays `text-white` (overrides the base `a:visited` purple)

`.my-link` -- looks like a hyperlink:
```
bg-transparent p-0 underline cursor-pointer
```
- State overrides are transparent-background versions: `.my-link.ghost` is `text-gray-400`, `.my-link.ready` is `text-blue-600` with hover `text-blue-400`, `.my-link.doing` is `text-orange-500`

**How they compose:** A `<Button>` component applies `my-button` or `my-link` (via the `link` prop) plus a state class (`ghost`, `ready`, or `doing`). The result is a consistent look for anything button-like or link-like across the whole site, controlled from one place:

```vue
<button
  :disabled="computedState != 'ready'"
  :class="[link ? 'my-link' : 'my-button', computedState]"
  @click="onClick"
>
```

## Component styling patterns

Out of ~70 Vue files in `site/app/`, the vast majority use Tailwind utility classes directly in templates with no `<style>` block at all. 13 components use `<style scoped>`.

### Pattern 1: Utility classes in templates (dominant, ~57 of ~70 components)

Classes go directly on elements. Dynamic styling uses Vue's `:class` array binding:

```vue
<input :class="[
  'block w-full px-4 py-2 border-4 rounded-lg focus:outline-none',
  borderClass,
  isFocused ? 'border-dashed' : 'border-solid'
]" />
```

```vue
<p class="mt-2 flex flex-wrap items-baseline gap-2">
```

```vue
<span class="bg-fuchsia-200 px-1">{{ refName2 }}</span>
```

No `<style>` block needed. This is the preferred default.

### Pattern 2: Scoped styles with @apply (13 components)

Used when a set of Tailwind utilities needs a name for readability or reuse within a single component. These still use `@apply` to stay in the Tailwind system:

**`.my-space`** -- appears in 5 components (CredentialCorner, CredentialPanel, PostPage, ProfilePage, SignUpOrSignInForm):
```css
<style scoped>
.my-space {
  @apply flex flex-wrap items-baseline gap-2;
}
</style>
```

**Terms components** (TermsPage, TermsComponent, TermsDocument, TermsAnchors) -- use scoped styles for multi-column layout, scroll containers, text treatment, and link color overrides specific to the terms/legal display context.

### Pattern 3: Scoped styles with raw CSS (rare)

Used only when Tailwind utilities don't cleanly express the need:

**PostComponent.vue** and **MeasureComponent.vue** -- fixed pixel heights and specific hex colors for scroll measurement test fixtures:
```css
.post-class {
  height: 250px;
  background-color: #eee;
  border: 4px dashed #bbb;
  padding: 20px;
}
```

**feed.vue** -- fixed-position debug overlay:
```css
.floating-status {
  position: fixed;
  bottom: 24px;
  left: 24px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  z-index: 1000;
  font-family: monospace;
}
```

**QrCode.vue** -- forces light-mode rendering to survive aggressive mobile dark modes:
```css
.myLightOnly {
  color-scheme: light only;
  filter: none !important;
  opacity: 1 !important;
}
```

## Layouts

`site/app/layouts/column-layout.vue` wraps content in the `.page-container` class from style.css, providing the centered `max-w-screen-md` column with padding:

```vue
<div class="page-container">
  <NavigationBar :note="route.meta.note" />
  <main><slot /></main>
</div>
```

`site/app/layouts/default.vue` is bare: just `<main><slot /></main>`.

`site/app/layouts/blank-layout.vue` also exists for pages that need no chrome.

## Color palette in use

These colors appear across style.css and component templates:

| Role | Colors |
|---|---|
| Body text | `gray-800` |
| Links | `blue-600`, hover `blue-400` |
| Visited links | `purple-600`, hover `purple-400` |
| Active links | `red-800` |
| Ready/success state | `green-600`, hover `green-400` |
| Doing/progress state | `orange-500` |
| Ghost/disabled state | `gray-400` |
| Error/invalid | `red-400`, `red-600` |
| Code/pre | `gray-400` |
| Highlight | `fuchsia-200` |
| Subtle text | `gray-500`, `gray-700` |

## Summary of principles

1. **Utility-first by default.** Put Tailwind classes directly in templates. No `<style>` block needed for most components.
2. **Global component layer for shared visuals.** `.my-button`, `.my-link`, and state classes (`.ghost`, `.ready`, `.doing`) are defined once in style.css and used everywhere something needs to look like a button or link.
3. **Scoped styles only when needed.** Use `<style scoped>` with `@apply` when utilities need a name for readability within a component, or raw CSS when Tailwind can't express the need (fixed positioning, pixel values, `!important` overrides).
4. **Theme extends fonts only.** The tailwind.config.js is minimal -- just font families. No custom colors, spacing, or breakpoints. Default Tailwind palette and scale are used directly.
5. **Forms plugin for baseline.** `@tailwindcss/forms` normalizes form controls so they inherit site typography and look consistent without extra work.

# [3] Migration Plan, Taking site from Tailwind 3 to 4

We're on the `migrate1` branch. Node 22, pnpm 10.28.2. A codebase audit found only 9 utility renames needed across 4 files, no bare borders without colors, no opacity utilities, no `theme()` calls. This is a clean migration.

## Overview

The migration has two parts: **infrastructure** (how Tailwind gets loaded) and **code** (what the CSS and templates say). Infrastructure is steps 1-4. Code is steps 5-7. Then we verify.

## Step 1: Swap packages

Remove `@nuxtjs/tailwindcss` (the v3 Nuxt module). Add `tailwindcss` and `@tailwindcss/vite` (the v4 framework and its Vite plugin). Keep `@tailwindcss/forms` (works with v4 unchanged).

## Step 2: Update nuxt.config.js

Remove the Tailwind module from the modules array and the `configuration.tailwindcss` config line. Replace with two things: register `@tailwindcss/vite` as a Vite plugin (same imperative push pattern already used for vidstack), and add `style.css` to Nuxt's `css` array (this is how Nuxt loads a global stylesheet without a module).

## Step 3: Rewrite style.css for Tailwind v4

This is the main file. The structure becomes:

1. **@font-face declarations** -- unchanged, stay at top
2. **`@import "tailwindcss"`** -- replaces the three `@tailwind base/components/utilities` directives
3. **`@plugin "@tailwindcss/forms"`** -- plugin registration moves here from tailwind.config.js
4. **`@theme { ... }`** -- font family definitions move here from tailwind.config.js, rewritten as CSS custom properties (`--font-sans`, `--font-mono`, etc.) with full fallback stacks spelled out (can't use JS spread syntax in CSS)
5. **`@layer base { ... }`** -- unchanged, works in v4 as native CSS cascade layers
6. **`@layer components { ... }`** -- unchanged structurally; our classes are applied by name and don't need Tailwind variant support, so native cascade layers work fine. Two utility renames inside: `rounded` -> `rounded-sm` (preserves 0.25rem) and `outline-none` -> `outline-hidden` (preserves v3 behavior)

## Step 4: Delete tailwind.config.js

Its two responsibilities (forms plugin registration and font family extensions) have moved into style.css. The file is no longer needed or auto-detected by v4.

## Step 5: Rename utilities in Vue templates

The v4 scale shift and deprecations affect 9 spots across 4 files. All in `site/app/components/snippet1/`:

| Rename | Why | Files |
|---|---|---|
| `rounded` -> `rounded-sm` | Default shifted down; `rounded-sm` preserves 0.25rem | TotpDemo.vue, TotpDemo1.vue (3 spots) |
| `outline-none` -> `outline-hidden` | `outline-none` now means `outline-style: none`; `outline-hidden` preserves v3 behavior | StyleComponent.vue (2 spots) |
| `flex-shrink-0` -> `shrink-0` | Old name removed in v4 | TotpDemo.vue, TotpDemo1.vue (2 spots) |

Nothing else in the codebase uses deprecated or renamed utilities. No `bg-opacity-*`, no `flex-grow`, no bare `shadow` or `blur`, no `theme()`, no bare `border` without a color.

## Step 6: Add @reference to scoped styles that use @apply

In v4, `@apply` in `<style scoped>` can't resolve Tailwind classes without an explicit `@reference "tailwindcss"` directive at the top of the style block. This tells the scoped CSS processor where to find the class definitions.

**9 components need this** (the ones with `@apply` in their scoped styles):
- 5 use `.my-space`: CredentialCorner, CredentialPanel, SignUpOrSignInForm, PostPage, ProfilePage
- 4 are terms components: TermsPage, TermsComponent, TermsDocument, TermsAnchors

**4 components with scoped styles do NOT need this** (raw CSS only, no `@apply`): PostComponent, MeasureComponent, feed.vue, QrCode.vue.

## Step 7: Run dev and verify

Start the dev server and check:
- Pages render with correct fonts (Diatype Rounded as default sans)
- Buttons show green/gray/orange states correctly
- Links are blue, visited purple
- Form inputs are normalized (forms plugin working)
- Terms pages render multi-column layout correctly
- No build errors from scoped @apply
- No console warnings about unresolved classes

## Expected: OKLCH color shift

Tailwind v4 defines colors in OKLCH (wider P3 gamut) instead of sRGB hex. The color names are unchanged but the underlying values are slightly different. This is cosmetic, subtle, expected, and not a bug. If any specific color looks wrong, we can pin exact values in `@theme`.

## Risks

| Risk | Why it's low | What we'd see |
|---|---|---|
| @apply breaks in scoped styles | We have the complete list of 9 files | Build error, obvious and immediate |
| Missed utility renames | Audit was exhaustive, only 4 files affected | Visual glitch, obvious on the page |
| Forms plugin breaks | Confirmed compatible with v4 | Broken form inputs, visible immediately |
| @layer components behaves differently | Our classes are applied by name, never with variants like `hover:my-button` | Classes not applying, obvious |
| Vidstack plugin conflict | Both are standard Vite plugins, no shared concerns | Build error, immediate |

## Appendix: Verification workflow

The monorepo has a pipeline for validating changes before running the site or committing. `ja` is a shell alias that wraps `pnpm` with a timer.

1. **`ja wash`** -- deletes all `node_modules` and build artifacts (`.nuxt`, `.output`, `.wrangler`, `dist`, etc.) across every workspace. Keeps the lockfile.
2. **`ja install`** -- reinstalls everything from `package.json` and `pnpm-lock.yaml`. Runs postinstall hooks (`nuxt prepare`, `svelte-kit sync`). If this fails, there's a real dependency or config problem.
3. **`ja sem`** -- runs `sem.js`, which reads every workspace's `package.json` and the lockfile, fetches live data from the npm registry, and writes `sem.yaml`. The report shows declared vs installed vs current vs latest versions for every dependency, with flags for staleness, deprecation, major upgrades, etc. Diffing `sem.yaml` before and after a change shows exactly what moved in the dependency tree.
4. **`ja seal`** -- runs `seal.js` then `test.js`. Seal hashes every file in the project into `wrapper.txt` (a manifest of SHA256 hashes and sizes), then generates `icarus/wrapper.js` with a frozen object containing the manifest hash, file counts, timestamps, and encrypted secrets. Tests run immediately after. If tests fail, the seal is invalid.
5. **`git diff > diff.diff`** -- with all of the above passing, generate a diff of everything: code changes, lockfile changes, `sem.yaml` changes, `wrapper.txt` changes. This is the complete picture for code review before committing.

The key insight is that `sem.yaml` and `wrapper.txt` are diffable artifacts. When you change a dependency, the sem diff shows what version moved and how, and the wrapper diff shows what files changed and by how much. This catches unintended side effects before they reach the dev server.

# [4] Review Notes

## Packages (sem.yaml, site/package.json)

Reviewed and confirmed correct.

The module `@nuxtjs/tailwindcss` (306K weekly downloads, pinned at exact version 6.14.0) is removed. It bundled Tailwind v3 as a hidden transitive dependency -- tailwindcss never appeared in any of our package.json files, making it invisible to version tracking.

Replaced by two direct dependencies in site/package.json:
- `tailwindcss: ^4.1.18` (47.8M weekly downloads) -- the framework itself, now visible and version-tracked
- `@tailwindcss/vite: ^4.1.18` (6.6M weekly downloads) -- the Vite plugin that replaces the Nuxt module

`@tailwindcss/forms: ^0.5.10` stays in devDependencies, unchanged.

Both new packages use caret ranges, consistent with the majority of our deps. The pinned list in sem.yaml drops from 3 to 2 entries (only `@pinia/nuxt` and `nuxt-og-image` remain pinned). We moved from a 6-figure community module to the 8-figure core package -- much more mainstream, and one fewer exact pin to worry about.

## @reference additions (9 Vue components)

Reviewed and confirmed correct.

In v3, the Nuxt module wired things up so `@apply` in `<style scoped>` could resolve Tailwind classes automatically. In v4, scoped CSS is processed in isolation -- it doesn't know what `flex` or `gap-2` means unless told where to look. `@reference "tailwindcss"` imports Tailwind's class definitions for resolution only, without emitting any CSS.

Added to all 9 components that use `@apply` in scoped styles:
- 5 with `.my-space`: CredentialCorner, CredentialPanel, SignUpOrSignInForm, PostPage, ProfilePage
- 4 terms components: TermsPage, TermsComponent, TermsDocument, TermsAnchors

Correctly skipped the 4 scoped style blocks that use only raw CSS (no `@apply`): PostComponent, MeasureComponent, feed.vue, QrCode.vue.

## Template renames and utility audit

Reviewed and confirmed correct.

Tailwind v4 renamed a handful of utilities to resolve naming inconsistencies from v3. We searched the entire codebase for every known rename and found only 9 spot changes needed across 3 components:

- **TotpDemo.vue**: `flex-shrink-0` -> `shrink-0`, `rounded` -> `rounded-sm`
- **TotpDemo1.vue**: `rounded` -> `rounded-sm` (x2), `flex-shrink-0` -> `shrink-0`
- **StyleComponent.vue**: `focus:outline-none` -> `focus:outline-hidden` (x2)

The audit searched for every v4-renamed utility: bare `rounded` (now `rounded-sm`), `outline-none` (now `outline-hidden`), `shadow` / `shadow-sm`, `blur` / `blur-sm`, bare `ring`, `bg-opacity-*` / `text-opacity-*` / `border-opacity-*`, `flex-grow` (now `grow`), `flex-shrink` (now `shrink`), `overflow-ellipsis`, bare `border` without an explicit color, and `theme()` function calls. Most had zero hits. The only matches were the 9 instances above.

No other components needed template changes. The ~60 remaining Vue files use utilities that are identical in v4: spacing (`p-`, `m-`, `gap-`), sizing (`w-`, `h-`, `max-w-`), flexbox (`flex`, `justify-`, `items-`, `shrink-0` already correct), grid, overflow, columns, typography (`text-`, `font-`, `leading-`, `tracking-`), and responsive/state variants.

## Terms layout safety

The terms pages (TermsPage, TermsComponent, TermsDocument, TermsAnchors) use a complex multi-column layout with side-scrolling, built over a month by a design intern. All of their Tailwind utilities are structurally identical between v3 and v4:

- **Layout**: `flex`, `flex-col`, `gap-*`, `columns-*`, `break-inside-avoid` -- no renames, no behavioral changes
- **Sizing**: `w-full`, `max-w-*`, `h-*`, `min-h-*` -- pixel-identical
- **Overflow/scroll**: `overflow-x-auto`, `overflow-y-hidden`, `scroll-smooth` -- unchanged
- **Typography**: `text-sm`, `text-lg`, `font-bold`, `leading-*`, `tracking-*` -- same output
- **Spacing**: all `p-*`, `m-*`, `gap-*` values -- same output

The only changes to these files were the `@reference` additions in their scoped style blocks, which affect resolution only and emit no CSS.

## Visual testing after the migration

The v4 upgrade is structurally a no-op for layout. Flexbox, grid, spacing, sizing, overflow, columns, and typography utilities produce identical CSS output. There is no need to fine-tooth-comb every page for layout regressions.

What *is* subtly different in v4, and worth a visual scan:

- **OKLCH colors**: v4 uses the OKLCH color space instead of sRGB hex. The utility names are the same (`bg-blue-500`, `text-gray-700`, etc.) but the rendered values shift slightly -- colors may appear marginally more vibrant or saturated. This is most noticeable in mid-range blues and purples. A quick visual pass through pages with prominent color use is worthwhile.
- **Placeholder color**: v3 defaulted to `gray-400`; v4 defaults to the element's text color at 50% opacity. If any inputs have visible placeholder text, check that it still looks right.
- **Button cursor**: v3 gave `<button>` elements `cursor: pointer` in its reset; v4 leaves the browser default (`cursor: default`). Our `.my-button` class already applies `cursor-pointer` explicitly, so this shouldn't matter for styled buttons, but check any unstyled `<button>` elements.
- **Hover on touch**: v4 wraps hover styles in `@media (hover: hover)`, which suppresses them on touch-only devices. This is generally an improvement but worth testing on mobile if sticky hover states were relied on.

Recommended testing approach: spin up the dev server, walk through the main flows (sign in, profile, posts, terms document), and glance at colors and interactive elements. The terms page deserves an extra look for scroll behavior on mobile. Any differences should be cosmetic color shifts, not layout breaks.

## nuxt.config.js and the integration layer

Reviewed and confirmed correct.

The migration drops down a layer in how Tailwind reaches the project. `@tailwindcss/vite` is a Vite plugin, not Vue- or Nuxt-specific -- it works for any Vite project (React, Svelte, plain HTML, whatever). The chain changes from:

- **Before**: Nuxt → `@nuxtjs/tailwindcss` module (community-maintained, Nuxt-specific) → Tailwind
- **After**: Vite → `@tailwindcss/vite` plugin (maintained by the Tailwind team, framework-agnostic) → Tailwind

Nuxt exposes its underlying Vite config, so `configuration.vite.plugins.push(tailwindcss())` registers the plugin right next to where vidstack is already registered the same way. The `//for tailwind` comment stays. The CSS file path moves from `configuration.tailwindcss = {cssPath: ...}` (a module-specific option) to `configuration.css = [...]` (standard Nuxt CSS entry point).

Fewer middlemen, more mainstream. Instead of going through a Nuxt-specific wrapper that a community developer maintains, we're plugging directly into the build tool using the official plugin from the Tailwind team.

## style.css and the deleted config file

Reviewed and confirmed correct.

Everything from `tailwind.config.js` is accounted for in style.css: the forms plugin becomes `@plugin "@tailwindcss/forms"`, and the font family definitions become CSS custom properties inside `@theme`. The old JS config used `...defaultTheme.fontFamily.sans` to spread Tailwind's default fallback list; in the CSS version the fallback stacks are spelled out explicitly. Those values are Tailwind's defaults -- just visible instead of imported programmatically.

The three `@tailwind` directives (base, components, utilities) become `@import "tailwindcss"`. The three layers still exist internally -- they're just not something you spell out anymore. The `@layer base` and `@layer components` blocks lower in style.css still work exactly as before; what changed is how you tell Tailwind to show up in the first place. `@plugin` is the v4 way to register plugins in CSS rather than in a JS config file.

The two utility renames in `.my-button` (`rounded` → `rounded-sm`, `outline-none` → `outline-hidden`) produce identical CSS output to what they replaced.

## Fonts: full stack analysis

There are three standard approaches to web fonts, and this repo uses all three:

**Approach 1 -- System fallbacks (name them).** Every font-family list in `@theme` ends with a stack of well-known system fonts: `ui-sans-serif, system-ui, sans-serif` for text, `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas` for code. These give the browser good built-in options if nothing custom loads. The emoji fallbacks (`Apple Color Emoji`, `Segoe UI Emoji`, etc.) are also in this category.

**Approach 2 -- Google Fonts (link them).** `nuxt.config.js` injects a `<link>` tag into `<head>` that loads three font families from Google's CDN: Noto Sans (regular, italic, bold, bold italic), Noto Sans Mono (same weights), and Roboto (regular, italic, 500/semibold). This is independent of Tailwind -- it's just an HTML link tag, unchanged by the migration.

**Approach 3 -- Bundled woff2 (bring them).** Two woff2 files live in `site/public/fonts/`: ABCDiatypeRounded-Regular-Trial.woff2 and Lemon-Wide.woff2. The `@font-face` declarations at the top of style.css register these with `font-display: swap`. Because they're in `public/`, Nuxt serves them as static assets and they deploy to Cloudflare Workers alongside the site.

How the fonts map to Tailwind theme configuration:

- **Diatype Rounded** (bundled woff2): first in `--font-sans` (site-wide default for body text), also available as `font-diatype` utility
- **Noto Sans** (Google Fonts): second in `--font-sans` fallback chain
- **Noto Sans Mono** (Google Fonts): first in `--font-mono` (site-wide default for code)
- **Roboto** (Google Fonts): `font-roboto` utility
- **Lemon Wide** (bundled woff2): `font-lemon` utility
- **System stacks** (built into browsers): tail of every font-family list

For v4 correctness: the `@font-face` declarations sit above `@import "tailwindcss"`, which is correct -- they need to be defined before Tailwind's reset. The `@theme` block uses CSS custom properties (`--font-sans`, `--font-mono`, `--font-roboto`, etc.), which is the v4 pattern replacing the old JS `theme.extend.fontFamily` object. The Google Fonts link in nuxt.config.js is completely independent of Tailwind. Nothing about the font setup needed to change for v4 beyond moving the family definitions from JS to CSS, which we already did.

## Custom font utilities in scoped styles

Build failed with: `Cannot apply unknown utility class 'font-roboto'` in TermsDocument.vue.

**The problem.** `@reference "tailwindcss"` gives scoped style blocks access to Tailwind's built-in utilities, but not to custom utilities defined in our `@theme` block. The built-in font utilities (`font-sans`, `font-mono`) work because those names exist in Tailwind's defaults -- our `@theme` overrides their values at runtime via CSS variables, but the compiler already knows the classes exist. Custom names we invented (`font-roboto`, `font-diatype`, `font-lemon`) don't exist in Tailwind's base, so the compiler rejects them. This is not about how the font arrives (Google CDN vs bundled woff2 vs system) -- it's about whether the utility name is built-in or custom.

Currently only `font-roboto` is used in scoped `@apply` (TermsDocument and TermsComponent). But `font-diatype` and `font-lemon` would hit the same wall if anyone used them in a scoped style block.

**Tailwind's documented preference hierarchy** (from their compatibility page):

1. Best: don't use `@apply` in scoped styles at all -- put utility classes in templates. Tailwind's Vite plugin scans templates and generates the CSS. No scoped resolution needed.
2. Good: use CSS variables directly -- `font-family: var(--font-roboto)` instead of `@apply font-roboto`. All `@theme` values are emitted as CSS custom properties on `:root`, available everywhere without `@reference`.
3. Acceptable: use `@reference` pointing to your main CSS file instead of bare `"tailwindcss"`.

**Option 1 -- Move the class to the template.** Put `font-roboto` in the `class=""` attribute on the HTML element instead of in `@apply`. This is the Tailwind team's ideal pattern. The tradeoff: TermsDocument currently groups text size, color, font, leading, and spacing together in `.myTerms` via `@apply`, which reads as a single design declaration. Moving just `font-roboto` out to the template splits that intent across two places.

**Option 2 -- Use the CSS variable directly.** Replace `@apply font-roboto` with `font-family: var(--font-roboto)` in the scoped style. Plain CSS reading a variable, zero machinery, works everywhere. The tradeoff: mixing `@apply` shorthand with raw CSS in the same rule block. Slightly less uniform but totally functional.

**Option 3 -- Switch `@reference` to point at our stylesheet.** Add a Node.js subpath import in package.json (`"#style.css": "./app/assets/css/style.css"`), then change all 9 components from `@reference "tailwindcss"` to `@reference "#style.css"`. This makes every custom utility available in every scoped style block. Vite aliases (`~/`, `@/`) do not work inside `@reference` -- the Tailwind plugin doesn't resolve them -- so a subpath import or relative path is required. The tradeoff: heavier compilation (Tailwind processes each component's style block against the full stylesheet) and a subpath import convention the team needs to know about. But it's the documented pattern for this exact situation.

## Resolution: plain CSS for custom fonts, Tailwind for defaults

Chose a simplified version of Option 2. The root insight: the custom named utilities (`--font-roboto`, `--font-diatype`, `--font-lemon`) in `@theme` were middlemen. They only existed to create Tailwind utility class names, and those names only worked in templates, not in scoped `@apply` (which is where `font-roboto` was actually used). Removing the middlemen and using plain CSS eliminates the problem entirely.

Changes made:
- Removed `--font-roboto`, `--font-diatype`, `--font-lemon` from `@theme` in style.css. Kept `--font-sans` and `--font-mono` (built-in names that Tailwind already knows).
- TermsDocument.vue: replaced `font-roboto` in the `@apply` block with `font-family: "Roboto", sans-serif` as plain CSS on the next line.
- TermsComponent.vue: replaced `font-roboto` in the template class attribute with `style="font-family: 'Roboto', sans-serif;"`.

Build passes. `@reference "tailwindcss"` stays in all 9 components.

**The rule going forward:** Tailwind's built-in font utilities (`font-sans`, `font-mono`) work everywhere -- in templates, in `@apply`, in scoped styles -- because Tailwind knows those names. Our `@theme` overrides change their values (Diatype Rounded for sans, Noto Sans Mono for mono) but the utility names are built-in. For one-off font choices (like setting the terms document in Roboto), use plain CSS: `font-family: "Roboto", sans-serif`. The browser knows the font because the Google Fonts `<link>` in nuxt.config.js loaded it. No Tailwind involvement needed.

Example: to set a textarea in Noto Sans Mono, use `class="font-mono"` or `@apply font-mono` in a scoped style. This works because `font-mono` is built-in and `--font-mono` points at Noto Sans Mono via our `@theme` override.

## Google Fonts URL fix (pre-existing bug)

During visual testing, the terms document appeared in a denser, narrower font than expected -- the system sans-serif (Helvetica/SF Pro) instead of Roboto. This was not caused by the Tailwind migration.

The Google Fonts CSS2 API was returning HTTP 400 for our font URL. The axis tuples must be sorted numerically, but our URL had them interleaved: `ital,wght@0,400;1,400;0,700;1,700` (ital 0, then ital 1, then back to ital 0). The API requires: `ital,wght@0,400;0,700;1,400;1,700` (all ital 0 values first, then all ital 1 values).

This means all three linked fonts (Noto Sans, Noto Sans Mono, Roboto) were silently failing to load.

Verified with Chrome DevTools (Elements > Computed > Rendered Fonts):
- **Production** (cold3.cc/terms): rendering `.SF NS` (SF Pro, Apple's system font) from a local file. Roboto is not loading.
- **Localhost**: rendering `Roboto-Regular` from a network resource (Google Fonts CDN). Roboto is loading correctly.

Production was never showing Roboto -- it was showing SF Pro via the fallback stack. The visual difference between localhost and production was localhost being *correct*, not broken. We confirmed this by temporarily swapping in IBM Plex Sans (a visually distinctive font) to prove Google Fonts loading works, then switching back to Roboto.

Fix: reordered all three font family axis tuples in nuxt.config.js to sorted order. Also removed the `&subset=latin,latin-ext` parameter, which is a CSS v1 API feature -- the CSS2 API handles subsetting automatically via `unicode-range` in the `@font-face` declarations it generates.
