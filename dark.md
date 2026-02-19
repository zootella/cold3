
# Dark Mode Notes

Starting point:
- nuxt 4 site in site workspace
- tailwind 4 installed as a vue thing, not a nuxt thing
- shadcn/ui installed also, check all that out

Experience:
- sun/moon toggle in upper right corner
- settings expose third option to return to system indicated option

Goals:
- no cookie warning requirement
- no flash on first load
- site follows light or dark depending on system by default
- or after a user's sun or moon click, follows that setting
- that setting is per browser, not per user

# Color Mode Implementation Plan

## Context

The site has full CSS dark mode infrastructure — `:root` and `.dark` blocks with 36 oklch color tokens, `@custom-variant dark (&:is(.dark *))`, and shadcn components ship with `dark:` utilities. But nothing activates it: no `.dark` class is ever added to the DOM, no system preference detection, no toggle UI, no persistence. Users with dark OS settings see light mode. The goal is standard color mode behavior: default to system preference, let users override to light/dark/system, persist the choice, and avoid a flash of wrong theme on load.

## Options evaluated

**@nuxtjs/color-mode** — First-party Nuxt module. Injects a render-blocking inline `<script>` in `<head>` that reads localStorage and applies the `.dark` class before first paint — no flash. Handles system preference detection, live OS change listening, localStorage persistence, tristate (light/dark/system), and a `useColorMode()` composable. v4.0.0, compatible with Nuxt 4.3.0, used by Nuxt UI. One new dependency.

**@vueuse/core useColorMode()** — Already installed. Supports tristate and live OS change listening. But it runs during/after hydration, not before first paint — known flash-of-wrong-theme problem (GitHub issues #2035, #1378). No cookie support, no SSR-safe rendering. You'd have to hand-write a head script to prevent flash, at which point you're reimplementing half of @nuxtjs/color-mode anyway.

**Hand-roll** — Full control, no new dependency. But you're writing 200-400 lines to handle: pre-paint script injection, localStorage read, system preference detection, live OS change listener, reactive composable, hydration mismatch avoidance, and cross-tab sync. All of this is a solved problem.

**Recommendation: @nuxtjs/color-mode.** The SSR flash prevention is the deciding factor — it's the hard part, and the module handles it correctly out of the box. VueUse's composable can't do it. Hand-rolling it is reinventing a well-maintained wheel. One small, focused dependency is worth it.

## Implementation

### 1. Install and register the module

```bash
pnpm add @nuxtjs/color-mode --filter site
```

In `nuxt.config.js`, add to modules:
```js
configuration.modules.push('@nuxtjs/color-mode')
```

The v4 defaults already match our needs: `preference: 'system'`, `fallback: 'light'`, `classSuffix: ''` (produces `.dark` not `.dark-mode` — the `-mode` suffix was a v3 default), `storage: 'localStorage'`. No `colorMode` config block is needed unless we want to override something.

### 2. CSS — no changes needed

The existing setup already works:
- `@custom-variant dark (&:is(.dark *))` matches descendants of `.dark` on `<html>`
- `:root` block provides light tokens, `.dark` block provides dark tokens
- `html, body { @apply bg-background text-foreground }` uses CSS variables that flip automatically
- shadcn's Switch.vue already has `dark:` utilities
- Link styles already have `dark:` stopgaps

No CSS changes required. The moment `.dark` lands on `<html>`, everything activates.

### 3. Build a color mode toggle component

Create `app/components/small/ColorModeToggle.vue` — a button that cycles light → dark → system. Uses `useColorMode()` from the module and Sun/Moon/Monitor icons from lucide-vue-next (already installed, first real use).

### 4. Place the toggle

Add `<ColorModeToggle>` to `NavigationBar.vue` (or wherever the site's persistent nav controls live).

### 5. Verify

- Dev server: toggle works, theme switches instantly, no flash on refresh
- Check system preference: set OS to dark, visit with no stored preference → dark theme
- Check persistence: pick dark, refresh → stays dark
- Check SSR: view page source → `<script>` in `<head>` that reads localStorage
- Check live OS change: toggle OS dark/light while page is open → follows if set to "system"

## Files to modify

| File | Change |
|------|--------|
| `site/package.json` | New dependency: @nuxtjs/color-mode (already added) |
| `site/nuxt.config.js` | Register module (v4 defaults are correct, no config block needed) |
| `site/app/components/small/ColorModeToggle.vue` | **New file** — toggle button with icon |
| `site/app/components/NavigationBar.vue` (or equivalent) | Add `<ColorModeToggle>` |

# Dark Mode Implementation: Research Findings and Technical Decision

February 2026

## Overview

This document summarizes our research into implementing dark mode on the site. It covers the UX design considerations, the technical state management problem, regulatory constraints around cookies, an evaluation of available implementation options, and our recommendation.

## UX Design Considerations

### Why Dark Mode Matters

Dark mode is now a table-stakes user expectation. The primary drivers are reduced eye strain in low-light environments, battery savings on OLED screens (Google confirmed approximately 60% power savings at full brightness), and aesthetic preference.

### Readability Tradeoffs

Research from Nielsen Norman Group suggests light mode actually produces better readability for long-form text. Dark mode can cause halation, where light text appears to bleed against dark backgrounds. This affects roughly half the population to some degree due to astigmatism. Dark mode is not universally easier on the eyes despite common assumptions.

### Design Principles

Effective dark mode cannot simply invert colors. Key considerations: avoid pure black (#000) backgrounds with pure white text as this creates excessive contrast and fatigue; use surface colors in the #121212 range; reduce saturation on accent colors to prevent vibrating against dark surfaces; communicate depth through lighter surface tones rather than shadows; and limit white text to approximately 87% opacity for body copy. WCAG contrast ratios still apply and must be audited for both modes.

## The Toggle Problem

### Two Inputs, Three States

The operating system provides a binary signal via the CSS `prefers-color-scheme` media query: light or dark. The site provides a sun/moon toggle, also binary in appearance. However, the underlying state model is a tristate, because the default condition is for the site to follow the system preference rather than enforcing its own.

The three states are: **system** (delegate to OS preference, the default), **light** (user explicitly chose light), and **dark** (user explicitly chose dark).

### UX Best Practice

The consensus among UX engineers is to present a two-state toggle (sun/moon icon) as the prominent control, with a separate settings option to revert to system. This pattern is used by GitHub, Tailwind docs, and most design-system-driven sites. The toggle handles the common case (switch between light and dark), while a settings page or dropdown exposes the full tristate including a *Use system theme* option.

### The Flash Problem

In server-side rendered applications, the server has no access to the user's OS theme preference. `prefers-color-scheme` is a browser-side concept. If the server renders HTML without the correct theme class, the browser paints that HTML before any JavaScript executes, causing a visible flash of the wrong theme before client-side hydration corrects it.

The solution is a small synchronous inline script in the document `<head>`. This script runs before the browser paints anything — it reads localStorage for a stored preference, and if none exists (first visit), calls `matchMedia('(prefers-color-scheme: dark)')` to detect the OS preference. Either way, it adds the correct class to `<html>` before first paint. No cookie is needed. The server doesn't need to know the theme because the HTML is the same for both modes — only the CSS interpretation changes, driven by CSS custom properties that flip when the `.dark` class is present. The inline script bridges the gap between "server can't know" and "browser hasn't hydrated yet" entirely client-side, using only synchronous browser APIs that return immediately.

## Cookie Compliance

Not applicable. The implementation uses localStorage, not cookies. No cookie is ever created for color mode. localStorage is a browser-side storage mechanism not transmitted in HTTP requests, so it is not covered by the ePrivacy Directive's cookie consent requirements. The site requires no consent popup for dark mode.

## Evaluation of Implementation Options

We evaluated four approaches for our stack (Nuxt 4, Tailwind 4, shadcn-vue, deployed on Cloudflare Workers).

### Option 1: @nuxtjs/color-mode — Recommended

The purpose-built Nuxt ecosystem module. It handles the tristate, persistence, and reactive OS changes. Source code review of v4.0.0 confirms: a synchronous inline script injected into `<head>` by a Nitro plugin reads localStorage and calls `matchMedia` before first paint — no flash, even on first visit with system preference and no stored value. The `<ColorScheme>` component (wrapping `<ClientOnly>`) is for hiding theme-dependent *text* (like the word "dark"), not for flash prevention — the flash is already handled by the inline script. The module defaults to localStorage (not cookie), so no cookie compliance question arises. The `classSuffix` default changed to `""` in v4, producing `.dark` directly. 267k weekly npm downloads, single-purpose, 5 runtime dependencies all from the Nuxt/unjs ecosystem.

### Option 2: VueUse useColorMode — Not Recommended

Already in our dependencies via `@vueuse/core`. It handles tristate logic and reactive state. However, it runs during or after hydration, not before first paint — known flash-of-wrong-theme problem (GitHub issues #2035, #1378). Solving the flash requires hand-writing a synchronous inline head script, at which point you're reimplementing the core of @nuxtjs/color-mode.

### Option 3: Roll Our Own — Not Recommended

A composable using localStorage for persistence and `matchMedia` for OS preference detection, plus a synchronous inline script in the `<head>` for flash prevention. The original estimate of 30–40 lines was optimistic — the module's client plugin alone is 108 lines handling edge cases like forced color mode per route, transition disabling, hydration mismatch recovery (`unknown` flag), and matchMedia listener lifecycle. Rolling our own would mean reimplementing a well-tested wheel for no practical benefit.

### Option 4: CSS-Only, No Toggle — Viable Fallback Only

Pure CSS `prefers-color-scheme` with no storage and no user override. Zero complexity and zero compliance concern. However, it does not meet the user expectation of a per-site toggle control.

## Recommendation

**Use @nuxtjs/color-mode (Option 1).** Source code review of v4.0.0 confirms it meets all requirements:

1. **No flash.** The inline head script runs synchronously before first paint. On first visit with no stored value, it calls `matchMedia("(prefers-color-scheme: dark)")` to detect OS preference. On return visits, it reads localStorage. Either way, the correct class lands on `<html>` before the browser paints anything. No cookie is needed — the server doesn't need to know the theme because the HTML is identical for both modes.
2. **No cookies.** The module uses localStorage by default. No cookie is ever created. No consent popup required.
3. **Small and auditable.** Four files totaling ~180 lines of runtime code, all readable. We audited it and understand exactly what each piece does (see "How @nuxtjs/color-mode Works" section below).

## Next Steps

- Register the module in nuxt.config.js (already installed in package.json)
- Build the toggle UI component with shadcn-vue
- Audit all color combinations in both modes against WCAG contrast ratios
- Address images, SVGs, and third-party embeds that need per-theme variants

# How @nuxtjs/color-mode Works

Source code review of v4.0.0, installed at `site/node_modules/@nuxtjs/color-mode/dist/`. The module has four runtime pieces plus a build-time setup step. All source paths below are relative to the `dist/` directory.

## Build-time: module setup (`module.mjs`)

When Nuxt boots, the module's `setup()` function runs. It reads the raw template `script.min.js`, performs string replacement to bake the configured options (storage type, storage key, class prefix/suffix, preference, fallback, global name) directly into the script text as string literals. The result is a self-contained JavaScript string with no external references.

It then registers four things with Nuxt:
- A **Nitro plugin** (`runtime/nitro-plugin.js`) that injects the baked script into every SSR response
- A **client plugin** (`runtime/plugin.client.js`) for reactive state after hydration
- A **server plugin** (`runtime/plugin.server.js`) for SSR state
- An auto-imported **composable** (`runtime/composables.js`) providing `useColorMode()`

It also registers a `<ColorScheme>` component, which is just a `<ClientOnly>` wrapper for hiding theme-dependent text during SSR — it has nothing to do with flash prevention.

The module hooks into `tailwindcss:config` to set `darkMode` on Tailwind's config object, but this hook only fires for the `@nuxtjs/tailwindcss` Nuxt module. Our site uses `@tailwindcss/vite` directly, so this hook never fires. Our existing `@custom-variant dark (&:is(.dark *))` in style.css handles the same job on the Tailwind side.

## Piece 1: The inline head script (`script.min.js` → injected by `runtime/nitro-plugin.js`)

This is the most important piece. The Nitro plugin is 6 lines — it hooks `render:html` and pushes `<script>${script}</script>` into `htmlContext.head`. The script itself, after template replacement, runs synchronously in the browser before first paint.

What the script does, step by step:

1. Reads storage. With the default `localStorage` setting, calls `window.localStorage.getItem("nuxt-color-mode")`. On first visit, this returns `null`.
2. Falls back to preference. If storage returned nothing, uses the configured preference — default `"system"`.
3. Resolves system preference. If the value is `"system"`, calls `window.matchMedia("(prefers-color-scheme: dark)")` and iterates `["dark", "light"]` to find which matches. If matchMedia is unavailable (rare), falls back to `"light"`.
4. Checks for forced mode. Reads `document.documentElement.getAttribute("data-color-mode-forced")` — a per-page override mechanism. If present, overrides the resolved value.
5. Adds the class. Calls `document.documentElement.classList.add("dark")` (or `"light"`). With the default empty `classPrefix` and `classSuffix`, this produces exactly `.dark` — matching our CSS `.dark { ... }` block and Tailwind's `@custom-variant dark (&:is(.dark *))`.
6. Pins state to window. Sets `window.__NUXT_COLOR_MODE__` to an object with `{ preference, value, getColorScheme, addColorScheme, removeColorScheme }`. The client plugin reads this after hydration.

Because this script is synchronous and lives in `<head>`, it executes before the browser parses or paints `<body>`. The `.dark` class is on `<html>` before any content is visible. This is why there is no flash — not even on first visit with no stored preference. The matchMedia call is synchronous and returns immediately.

## Piece 2: Server plugin (`runtime/plugin.server.js`, 34 lines)

Runs during SSR on the server. Creates reactive state via `useState("color-mode")` with `unknown: true`. The server cannot access localStorage (it doesn't exist server-side), so the state is a placeholder.

If `storage` is configured as `"cookie"` (not the default), the server plugin reads the cookie from request headers via `useRequestHeaders(["cookie"])` and parses the storage key from the cookie string. This lets the server know the user's preference for SSR. But even then, the server plugin does not add a class to `<html>` — that is always the inline script's job.

The `unknown: true` flag tells the client plugin that the server didn't know the real preference. The client plugin resolves this after mount (see below).

## Piece 3: Client plugin (`runtime/plugin.client.js`, 108 lines)

Runs after hydration in the browser. This is where the reactive runtime lives.

**Initialization.** Reads `window.__NUXT_COLOR_MODE__` (set by the inline script) to get the current preference and resolved value. Creates reactive state via `useState("color-mode")`.

**Route-level forced color mode.** Hooks `router.afterEach` and checks `to.meta.colorMode`. If a route defines a forced color mode, applies it and sets `colorMode.forced = true`, preventing other watchers from overriding it.

**Preference watcher.** Watches `colorMode.preference` with `immediate: true`. When preference changes:
- If `"system"`, resolves via `matchMedia` and starts the OS change listener.
- Otherwise, applies the explicit value.
- Persists to storage. With the default localStorage, calls `window.localStorage.setItem("nuxt-color-mode", preference)`. On first visit, this writes `"system"` to localStorage immediately — before any user interaction. For localStorage this is fine (no regulatory significance). If storage were `"cookie"`, this would write a cookie on first visit, which would be a compliance problem.

**Value watcher.** When `colorMode.value` changes, removes the old class from `<html>` and adds the new one. Optionally disables CSS transitions during the swap (if `disableTransition` is configured) by injecting and removing a `<style>` element.

**OS preference listener.** When preference is `"system"`, attaches a `change` event listener to `window.matchMedia("(prefers-color-scheme: dark)")`. If the user changes their OS theme while the page is open, the site follows. The listener is created once and not duplicated.

**Hydration recovery.** On `app:mounted`, if `colorMode.unknown` is true (meaning the server couldn't determine the preference), reads the real values from the inline script's global and updates the reactive state. This bridges the gap between the server's placeholder state and the client's actual state without causing a visible flash.

**Provides state.** Calls `nuxtApp.provide("colorMode", colorMode)`, making `$colorMode` available in templates and `useColorMode()` in composables.

## Piece 4: The composable (`runtime/composables.js`, 4 lines)

```js
export const useColorMode = () => {
  return useState("color-mode").value;
};
```

Returns the reactive state object with properties `preference` (read/write — set this to `"light"`, `"dark"`, or `"system"`), `value` (read-only — the resolved color, always `"light"` or `"dark"`), `unknown`, and `forced`. The toggle component will write to `preference`; everything else reacts.

## How it connects to the rest of the stack

**Browser/JavaScript.** The inline script uses `window.matchMedia`, `document.documentElement.classList`, and `window.localStorage` — all standard browser APIs. It pins the `__NUXT_COLOR_MODE__` global to `window` as a handoff mechanism between the synchronous head script and the async Vue hydration.

**Nuxt.** The module registers itself via `defineNuxtModule` and uses `@nuxt/kit` APIs: `addPlugin` for the client/server plugins, `addTemplate` for the baked options file, `addComponent` for the `<ColorScheme>` wrapper, `addImports` for the `useColorMode()` auto-import. The Nitro plugin hooks `render:html` to inject the head script during SSR. State is shared via `useState("color-mode")`, Nuxt's built-in SSR-safe reactive state mechanism.

**Tailwind.** The module has a `tailwindcss:config` hook that sets `darkMode` on Tailwind's config, but this only fires for the `@nuxtjs/tailwindcss` Nuxt module. We use `@tailwindcss/vite` directly (Tailwind as a Vite plugin, not a Nuxt module), so this hook is inert. Our dark mode integration with Tailwind is handled by `@custom-variant dark (&:is(.dark *))` in `app/assets/css/style.css`, which tells Tailwind that `dark:` utilities should match elements inside a `.dark` ancestor. The module puts `.dark` on `<html>`, Tailwind's custom variant matches it — they connect through the CSS class name and nothing else.

**shadcn/ui.** The module has no direct interaction with shadcn. shadcn components use Tailwind's `dark:` utilities and CSS custom properties that reference the tokens defined in the `:root` and `.dark` blocks in style.css. When the module puts `.dark` on `<html>`, the `.dark { ... }` CSS block activates, the custom properties change values, and every shadcn component using `bg-background`, `text-foreground`, `bg-primary`, etc. updates automatically. The `cn()` utility in `app/lib/utils.ts` passes through `dark:` classes unchanged.

**CSS variable flow.** The chain is: module adds `.dark` to `<html>` → CSS `.dark` block overrides custom properties (`--background`, `--foreground`, etc.) → `@theme inline` block maps these to Tailwind tokens (`--color-background`, `--color-primary`, etc.) → utility classes (`bg-background`, `text-primary`) and `dark:` variant classes resolve to the dark values.
