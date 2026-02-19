
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
pnpm add -D @nuxtjs/color-mode --filter site
```

In `nuxt.config.js`, add to modules and configure:
```js
configuration.modules.push('@nuxtjs/color-mode')
configuration.colorMode = {
  classSuffix: '',       // produces class="dark" not class="dark-mode"
  preference: 'system',  // default to OS preference
  fallback: 'light',     // if system preference unavailable
}
```

`classSuffix: ''` is critical — the module defaults to appending `-mode` (producing `.dark-mode`), but our CSS expects `.dark`.

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
| `site/package.json` | New devDependency: @nuxtjs/color-mode |
| `site/nuxt.config.js` | Register module, configure classSuffix/preference/fallback |
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

The solution is a small synchronous inline script in the document `<head>` that runs `matchMedia('(prefers-color-scheme: dark)')` and sets the appropriate class on `<html>` before first paint. Because this script is synchronous and executes before rendering, the first paint is correct with no flash, even on a first visit with no cookie.

For returning users who have explicitly chosen a theme, a cookie provides the preference to the server at request time, allowing correct SSR rendering without relying on the inline script fallback.

## Cookie Compliance

### Regulatory Constraint

Our requirement is that the site does not do anything that requires a consent popup, which harms user experience. The privacy policy discloses cookies in use generally, but no popup-level confirmation is required for any site functionality.

### Strictly Necessary Exemption

The ePrivacy Directive exempts cookies that are strictly necessary to provide a service explicitly requested by the user. The key insight is that a theme preference cookie is not set on first visit. It is only created when the user explicitly clicks the toggle, requesting a specific theme override. At that point, the cookie is strictly necessary to deliver the experience the user requested across page loads.

### Compliant Model

- **First visit, no interaction:** No cookie exists. The site follows the OS preference via CSS and the inline head script. Nothing is stored on the user's device.
- **User clicks the toggle:** A cookie is set with the value "light" or "dark". This is in response to an explicit user action requesting a specific experience.
- **User reverts to system:** The cookie is deleted (not set to "system"). The absence of a cookie is the system-following state.

This model means the cookie is only present when the user has an active override, and its creation is directly tied to an explicit user action.

## Evaluation of Implementation Options

We evaluated four approaches for our stack (Nuxt 4, Tailwind 4, shadcn-vue, deployed on Cloudflare Workers).

### Option 1: @nuxtjs/color-mode — Not Recommended

The purpose-built Nuxt ecosystem module. It handles the tristate, persistence, and reactive OS changes. However, its cookie behavior is opaque and may not match our compliance model. The module's own documentation acknowledges a flash problem with system preference during SSR, recommending a placeholder-based workaround rather than solving it cleanly. It defaults to localStorage (not cookie), and its behavior around when it writes storage is outside our control and could change between versions.

### Option 2: VueUse useColorMode — Not Recommended

Already in our dependencies via `@vueuse/core`. It handles tristate logic and reactive state. However, it is client-side only (localStorage by default) with no SSR awareness. Solving the flash problem would require manually wiring it to a cookie via Nuxt's `useCookie`, at which point we are effectively rebuilding Option 3 with extra indirection.

### Option 3: Roll Our Own — Recommended

A small composable using Nuxt's `useCookie` for persistence and `matchMedia` for OS preference detection, plus a synchronous inline script in the `<head>` for flash prevention. Approximately 30–40 lines of code. Full control over cookie timing (compliance) and flash behavior. The tradeoff is that we own maintenance and must handle edge cases ourselves, but these are well-understood problems.

### Option 4: CSS-Only, No Toggle — Viable Fallback Only

Pure CSS `prefers-color-scheme` with no storage and no user override. Zero complexity and zero compliance concern. However, it does not meet the user expectation of a per-site toggle control.

## Recommendation

**Roll our own implementation (Option 3).** This approach wins on three axes:

1. **Cookie compliance.** We control exactly when the cookie is created (only on explicit user toggle action) and deleted (when the user reverts to system). No third-party module can change this behavior in an update.
2. **Flash avoidance.** A synchronous inline script in the document head detects the OS preference via matchMedia and sets the correct class before first paint. This eliminates the flash even on first visit when no cookie exists, which the Nuxt color-mode module does not cleanly solve.
3. **Transparency.** A small composable we wrote and understand is easier to reason about, debug, and maintain than a module whose internals we would need to audit for cookie behavior and Nuxt 4 compatibility.

### Implementation Outline

The implementation consists of three parts:

1. **Inline head script:** A small synchronous script injected into the document `<head>` that checks for a theme cookie. If present, applies that value. If absent, reads matchMedia for OS preference. Sets the dark/light class on `<html>` before paint.
2. **Composable (useTheme):** A Vue composable that manages the reactive tristate. Uses Nuxt's `useCookie` for SSR-accessible persistence. Listens for OS preference changes via matchMedia when in system mode. Provides a toggle function and a reset-to-system function.
3. **Toggle UI component:** A sun/moon button using shadcn-vue components. The prominent control toggles between light and dark. A settings option (dropdown or settings page) exposes the full tristate including the system option, which deletes the cookie.

## Next Steps

- Confirm cookie compliance interpretation with our compliance team
- Implement the composable and inline head script
- Audit all color combinations in both modes against WCAG contrast ratios
- Build the toggle UI component with shadcn-vue
- Address images, SVGs, and third-party embeds that need per-theme variants
