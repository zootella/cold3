
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

## notes, scraps

how do QR codes look at work through dark mode changes?

is the sun moon control really good looking, like as good looking as those on the best sites of the web?

test that before a click, the site follows the os setting, and after a click, it follows the clicked local setting

confirm tehre's no flicker even on first load

how do i manually delete the local storage thing to test a user's first visit?

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

The module is already installed in `site/package.json`. Register it in `nuxt.config.js`:

```js
configuration.modules.push('@nuxtjs/color-mode')
```

The v4 defaults already match our needs: `preference: 'system'`, `fallback: 'light'`, `classSuffix: ''` (produces `.dark` not `.dark-mode` — the `-mode` suffix was a v3 default), `storage: 'localStorage'`. No `colorMode` config block is needed.

### 2. CSS — no changes needed

The existing setup already works:
- `@custom-variant dark (&:is(.dark *))` matches descendants of `.dark` on `<html>`
- `:root` block provides light tokens, `.dark` block provides dark tokens
- `html, body { @apply bg-background text-foreground }` uses CSS variables that flip automatically
- shadcn's Switch.vue already has `dark:` utilities
- Link styles already have `dark:` stopgaps

No CSS changes required. The moment `.dark` lands on `<html>`, everything activates.

### 3. Two controls

**DarkSwitch** (`app/components/small/DarkSwitch.vue`) — a compact icon button in the site header. Shows Sun icon in light mode, Moon icon in dark mode. Clicking toggles to the opposite. Lives in TopBar alongside NotificationList and OtpEnterList.

**LocalPanel** (`app/components/small/LocalPanel.vue`) — a settings panel on page1, next to CredentialPanel. Contains three radio inputs with text labels: Light, Dark, System. Follows the bordered-box pattern established by CredentialPanel and CredentialCorner (`border border-gray-300 p-2`, italic label in upper right).

### 4. DarkSwitch design

The standard shadcn dark mode toggle is a Button (not a Switch — nobody in the shadcn ecosystem uses the Switch component for this). The canonical pattern is an icon-sized button with overlapping Sun and Moon icons that animate via CSS `dark:` rotation and scale transitions:

```
Sun:  rotate-0 scale-100  →  dark:-rotate-90 dark:scale-0
Moon: rotate-90 scale-0   →  dark:rotate-0 dark:scale-100
```

Both icons render simultaneously. CSS `dark:` variants hide one and show the other with a smooth rotation effect. No JavaScript animation needed.

The button itself is styled to match shadcn's Button variant="outline" size="icon" — a small bordered square: `inline-flex items-center justify-center rounded-md border border-input bg-background h-9 w-9 hover:bg-accent hover:text-accent-foreground`. We apply these classes directly on a `<button>` element rather than adding a shadcn Button component, because a shadcn `Button.vue` would name-conflict with the existing `small/Button.vue` (Nuxt auto-imports both as `<Button>` since `pathPrefix: false`).

Icons are Sun and Moon from lucide-vue-next (already installed, first real use of the icon library).

### 5. Interaction model

**DarkSwitch (the icon button):**
- Before any user interaction, the switch reflects the system-resolved state. A light desktop user sees Sun. A dark desktop user sees Moon.
- Clicking creates a localStorage override to the **opposite** of the current resolved value. Light user clicks → overrides to dark (Moon). Dark user clicks → overrides to light (Sun).
- Clicking again flips the override. The user is now toggling between two explicit overrides — they've left "system" mode.
- The switch always shows the resolved value (`useColorMode().value`), not the preference. Whether in system mode or override mode, Sun means light and Moon means dark.

**LocalPanel (the radio group):**
- Three options: Light, Dark, System. All write directly to `useColorMode().preference`.
- The selected radio reflects the current preference, not the resolved value. A user in system mode on a dark desktop sees "System" selected, not "Dark".
- Choosing "System" clears the override — the site follows the OS again. This is the only way to return to system mode after DarkSwitch has created an override.
- Choosing "Light" or "Dark" creates the same override that DarkSwitch would.

**Walkthrough:** A light desktop user visits for the first time. No localStorage entry exists. The inline head script calls matchMedia, resolves to light, adds class `light` to `<html>`. The user sees a light site with Sun in DarkSwitch. They click DarkSwitch — preference is set to `"dark"`, localStorage stores `"dark"`, the site goes dark, Moon appears. They click again — preference flips to `"light"`, site goes light, Sun appears. They're now locked to light. If they change their OS to dark, the site stays light. To get back to following the OS, they go to LocalPanel and select System. The localStorage entry updates to `"system"`, the site resolves via matchMedia again, and future OS changes are followed.

### 6. Verify

- Dev server: DarkSwitch toggles, theme switches instantly, no flash on refresh
- System preference: set OS to dark, visit with no stored preference → dark theme, Moon in DarkSwitch
- Persistence: pick dark via DarkSwitch, refresh → stays dark
- SSR: view page source → `<script>` in `<head>` that reads localStorage
- Live OS change: toggle OS dark/light while page is open → follows if LocalPanel is set to System
- LocalPanel: selecting System after override → site follows OS again
- LocalPanel: selecting Light/Dark → matches DarkSwitch behavior

## Code changes

**`site/nuxt.config.js`** — Add `configuration.modules.push('@nuxtjs/color-mode')` in the modules section, after pinia and og-image.

**`site/app/components/small/DarkSwitch.vue`** — New file. A `<button>` element (not the site's existing Button component) styled to match shadcn's Button variant="outline" size="icon" appearance — a 9×9 bordered square using the theme's `border-input`, `bg-background`, and `hover:bg-accent` tokens. Contains Sun and Moon icons from lucide-vue-next, both rendered simultaneously in the same space (Moon is `absolute` to overlap Sun). CSS `dark:` variants on each icon handle the visual swap: Sun rotates out and scales to 0 in dark mode while Moon rotates in and scales to 100, with `transition-all` for smooth animation. No JavaScript animation. The click handler calls `useColorMode()` and sets `preference` to the opposite of the current `value` — so it always flips from whatever the user is currently seeing, regardless of whether they're in system mode or an explicit override. An `sr-only` span provides an accessible label.

**`site/app/components/small/LocalPanel.vue`** — New file. Follows the bordered-box visual pattern from CredentialPanel and CredentialCorner (`border border-gray-300 p-2`, italic label). Contains a fieldset with three radio inputs labeled Light, Dark, and System. The radio group v-models directly to `useColorMode().preference`, so selecting an option immediately writes to the module's reactive state, which persists to localStorage and resolves the theme. The `@tailwindcss/forms` plugin (already installed) provides baseline radio styling. No script logic beyond calling `useColorMode()`.

**`site/app/components/bars/TopBar.vue`** — Add `<DarkSwitch />` in the template before NotificationList and OtpEnterList. DarkSwitch is a visible persistent control; the other two are conditional overlays that appear on top of page content.

**`site/app/pages/page1.vue`** — Add `<LocalPanel />` in the template after CredentialPanel and before PasswordDemo.

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
