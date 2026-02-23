
# shadcn-vue Component Guide

## Stack

Nuxt 4 + Tailwind v4 (via `@tailwindcss/vite`, not `@nuxtjs/tailwindcss`) + shadcn-vue + Reka UI. shadcn-vue is the design layer — pre-styled Vue components built on Reka UI (headless accessible primitives) and Tailwind (utility CSS). The copy-not-install model means the CLI copies `.vue` source files into your repo and the connection to the registry is severed. There is no `shadcn-vue` entry in package.json. The files are yours to read, modify, and maintain.

```
Key files and paths:

site/components.json          — shadcn-vue CLI config (style, TypeScript flag, path aliases)
site/components.json.md       — this guide
site/app/lib/utils.ts         — cn() helper used by every shadcn component
site/app/assets/css/style.css — Tailwind entry, :root and .dark token blocks, @custom-variant
site/app/components/Reka/    — all scaffolded shadcn components live here (Switch, RadioGroup, etc.)

Created by the CLI each time, then cleaned up:
site/app/components/ui/<name>/index.ts  — barrel file, delete (Nuxt auto-imports by filename)
site/app/components/ui/<name>/          — scaffold target, move .vue files to Reka/, delete ui/
```

## Adding a component

From the `site/` directory (where `components.json` lives — the CLI won't find it from the repo root):

```bash
cd site
pnpm dlx shadcn-vue@latest add radio-group
```

Browse available components at https://www.shadcn-vue.com/docs/components

The CLI scaffolds files into `app/components/ui/<component-name>/`. After scaffolding, three cleanup steps:

1. **Delete the barrel file.** The CLI creates an `index.ts` that re-exports the `.vue` files. Nuxt's auto-imports make this unnecessary — Nuxt registers components by filename, not by barrel exports. Delete `index.ts`.

2. **Move the `.vue` files to `app/components/Reka/`.** All scaffolded components live in one flat folder. The capital letter visually distinguishes it from lowercase folders (`small/`, `bars/`, `credentials/`) which are entirely application-defined.

3. **Delete the `ui/` directory.** The CLI recreates `ui/<component-name>/` each time. After moving the files out, delete the empty directory tree. If `ui/` has nothing else in it, delete the whole thing.

After cleanup, the component is auto-imported by Nuxt and available in any template by its filename (e.g., `<RadioGroup>`, `<RadioGroupItem>`).

4. **If the dev server throws a type resolution error**, the Vue SFC compiler couldn't follow a complex type inheritance chain in reka-ui's type definitions. The error says "Failed to resolve extends base type" and points to a line like `interface RadioGroupItemProps extends Omit<RadioProps, 'checked'> {}`. The fix is adding `/* @vue-ignore */` inside the `defineProps<>` generic in the scaffolded component, before the type that fails to resolve: `defineProps</* @vue-ignore */ RadioGroupItemProps & { ... }>()`. This tells the compiler to skip resolving that type — the component works identically because props are forwarded to the Reka UI primitive at runtime anyway. Most types resolve fine (Switch didn't need this); apply only when the error appears.

## Component names must be unique

`nuxt.config.js` sets `pathPrefix: false`, meaning Nuxt registers all components by filename alone, ignoring their folder path. A `Reka/Button.vue` and a `small/Button.vue` would both register as `<Button>`, causing ambiguity. Before adding a shadcn component, check that no existing component in the project shares the same filename. The site's `small/Button.vue` is why DarkSwitch uses a raw `<button>` element styled with shadcn utility classes rather than importing shadcn's Button component.

## What the files are

Each shadcn component is a `.vue` SFC that wraps a Reka UI primitive and applies Tailwind styling. The `cn()` helper (from `app/lib/utils.ts`) merges base classes with any overrides you pass via the `class` prop — it uses `clsx` for conditional joining and `tailwind-merge` for deduplication.

Scaffolded components fall into three structural types. **Accessible stateful controls** like Switch and RadioGroup wrap Reka UI primitives that provide keyboard navigation, focus management, and ARIA attributes — the component file adds Tailwind styling on top. **Styled interactive primitives** like Button wrap a Reka UI `Primitive` element and use CVA (class-variance-authority) to map variant and size props to different class sets — no complex accessibility behavior, just appearance. **Purely structural** components like Card are just styled `<div>`s and headings with no Reka UI dependency at all.

Scaffolded components use `<script setup lang="ts">` and import TypeScript type interfaces from Reka UI for their prop definitions (e.g., `defineProps<RadioGroupRootProps>`). This is the TypeScript/JavaScript boundary — see below.

## TypeScript boundary

`components.json` has `"typescript": true`. This means the CLI scaffolds components with `lang="ts"` and TypeScript-generic `defineProps<>` syntax, which pulls prop definitions from Reka UI's exported type interfaces in a single line. With `"typescript": false`, the CLI enumerates every prop manually in verbose object syntax — same result, much more code.

The boundary is: **`lang="ts"` only inside the `Reka/` folder.** These are scaffolded plumbing files that wrap Reka UI primitives. You rarely read or edit them. The TypeScript buys terse prop declarations and you never have to think about it.

Everything else — your own components, pages, stores, composables, layouts — stays plain `<script setup>` with no `lang="ts"`. The TypeScript never leaks out because shadcn components expose normal Vue props to their consumers. When you write `<RadioGroupItem value="dark" />` in your own component, your component doesn't know or care that RadioGroupItem uses TypeScript internally.

## Most new components won't change package.json

The runtime dependencies are already installed: reka-ui, class-variance-authority, clsx, tailwind-merge, lucide-vue-next, @vueuse/core, tw-animate-css. These cover the vast majority of shadcn components. A few specialized components bring their own dependency (Toast pulls vue-sonner, Form pulls vee-validate), but those are deliberate feature additions.

**reka-ui** is the one dependency with meaningful risk. It's the headless primitive layer — every shadcn component that does anything interactive (Switch, RadioGroup, Dialog, Dropdown) wraps a Reka UI primitive for keyboard navigation, focus management, and ARIA. Created by Zernonia in 2023 as "Radix Vue," rebranded to Reka UI at v2 in 2025. It's the most complex package in the set, the most actively evolving, and depends on a small core team with no corporate backing. The mitigating factor is that Nuxt UI (the official Nuxt component library) also depends on Reka UI as its primitive layer, so the Nuxt team has a direct stake in its continued health. On the React side, the equivalent square is Radix UI, which had its own drama — acquired by WorkOS, original maintainers left, co-creator called it "a liability." Those engineers built Base UI (under MUI) as a successor, and shadcn/ui now supports both Radix and Base UI. On the Vue side there's no equivalent escape hatch — Reka UI is the only option for both shadcn-vue and Nuxt UI.

**lucide-vue-next** and **tw-animate-css** are low risk but worth noting. Lucide is the icon library — the pre-1.0 version flag is misleading (0.574 means "574th release," a rolling counter, not an unstable beta). It's a thin Vue wrapper over the Lucide icon set; if the project went dormant, existing icons would keep working. tw-animate-css provides CSS animation keyframes that shadcn components reference for transitions. It has the thinnest organizational backing (pseudonymous sole maintainer, downloads carried by shadcn adoption), but it's just a CSS file — if it vanished, you could inline the keyframes into style.css and delete the dependency.

The remaining dependencies are effectively zero risk. **@vueuse/core** is by Anthony Fu, a Vue core team member at NuxtLabs who maintains much of the Vue/Vite tooling ecosystem. **tailwind-merge** is the one that needs ongoing maintenance — it must understand Tailwind's class grammar to know that `px-2` and `px-4` conflict — but release cadence is healthy. **clsx** is 239 bytes, one function, finished software; the 21-month gap since its last release is completion, not neglect. **class-variance-authority** (CVA) maps variant props to class strings with no external dependencies; its pre-1.0 and 14-month-old flags simply reflect that there's nothing left to change. **typescript** is a devDependency required by the scaffolded components' `lang="ts"` — Microsoft-backed, no discussion needed.

## Three tiers of UI elements

**shadcn components** — the default for all standard user-facing controls: forms, buttons, dialogs, switches, radio groups, cards, dropdowns, etc. You get consistent visual language, built-in accessibility (keyboard nav, ARIA, focus rings), and dark mode through the token system. Every piece of normal UI should use this tier.

**shadcn tokens on raw elements** — for bespoke one-off controls that don't match any standard component. DarkSwitch is the example: a small icon-only toggle that should always look like a quiet neutral square. It has no states, no labeling, no behavior worth wrapping in a component. It applies shadcn's design tokens directly (`border-input`, `bg-background`, `hover:bg-accent`) on a raw `<button>`. It uses the shadcn design system without using a shadcn component, because no component matches what it is.

**Plain HTML with Tailwind** — only for error.vue, which deliberately uses no custom components, no stores, no imports. It has to work when everything else is broken.

## Migration ahead

The site is at the start of a large migration from raw HTML to shadcn components. Bare `<input>` elements, `<select>` boxes, and hand-styled controls across the site will be replaced with shadcn's Input, Select, and other components. Each migration brings consistent styling, dark mode support, and accessibility for free. The `@tailwindcss/forms` plugin (which normalizes bare form elements) can be removed once the last bare input is gone.

**Button is a special case.** The site's `small/Button.vue` is already a substantial, useful component with ~45 usages. It manages three states (ghost/ready/doing), awaits async click handlers, guards against double-clicks, exposes `.click()` and `.post()` methods via `defineExpose`, orchestrates Turnstile tokens, and shows labeling text while doing. None of this behavior exists in shadcn's Button, which is purely an appearance component — CVA maps variant and size props to Tailwind classes, nothing more.

The goal is to get our Button working with shadcn's Button, but the right relationship between the two isn't clear yet. Our Button could wrap shadcn's Button internally, replacing its raw `<button>` element with shadcn's styled one. Or it could extend shadcn's variant map with our states. Or the architecture could be something else entirely. This is a heavyweight task — the most complex single component migration on the site — and the approach needs to be worked out when we get there.

One naming overlap to watch during the Button rebuild: the site's CSS class `.ghost` (gray, disabled-looking) and shadcn's `variant="ghost"` (transparent with hover) mean different things. They don't collide technically (CSS class vs CVA prop), but the confusion is worth cleaning up — rename the site's ghost state to something like `unavailable`.

**NavigateButton.vue** wraps NuxtLink with `my-button ready` classes but has zero usages in the codebase. Delete it.

**No `<form>` elements.** The site uses the SPA pattern: `@keyup.enter="refButton.click()"` on inputs, Button.vue handles state and calls fetchWorker. No `<form>` tag, no `@submit.prevent`, no browser form state. This avoids "Confirm form resubmission?" dialogs, unwanted autocomplete behavior, and POST entries in browser history. This pattern continues as inputs migrate to shadcn components.

**Mobile keyboard hints.** When migrating inputs, preserve `type="tel"` / `type="email"` / `type="url"` to trigger the right mobile keyboard, and use `enterkeyhint="send"` / `"next"` / `"done"` to label the keyboard's Enter key appropriately.

## Icons

`lucide-vue-next` is installed as a shadcn dependency. DarkSwitch uses `Sun` and `Moon`, PasswordBox uses `Eye` and `EyeClosed`. QrCode.vue's programmatic SVG and app.vue's emoji favicon are not icon-library candidates.

## Global link styles

style.css has global `a` styles using hardcoded Tailwind colors (`text-blue-600`, `text-purple-600`, etc.) with `dark:` variants added as a stopgap. These work and links are visible in dark mode, but the colors don't respond to theme token changes. The eventual fix is migrating to CSS variable tokens (`--link`, `--link-visited`) so links participate in the same token system as everything else.

## Animation

shadcn components ship with `tw-animate-css` animations (fade, slide, scale) on dropdowns, dialogs, tooltips, and popovers. These are tuned for showcase feel, not production speed. The goal is a site that feels instant — cut transition durations in half or remove them. For components like tooltips and dropdowns, consider removing animation entirely. Respect `prefers-reduced-motion` — Tailwind v4 has `motion-safe:` and `motion-reduce:` variants. Any animation we keep should be wrapped in `motion-safe:` so it disappears for users who don't want it.

## Brand expression

shadcn's defaults (neutral gray palette, 0.625rem radius, generic font stack) are a clean starting point that announces "we haven't started designing yet." The levers for making the site look like itself rather than every other shadcn site:

**Typeface** — the single highest-impact change. The site already has Diatype Rounded and Lemon Wide loaded as custom fonts. Using a distinctive typeface consistently in headings, buttons, nav, and form labels immediately separates the site from the default look. The font stack in `@theme` in style.css controls this globally.

**Scale and weight** — default shadcn components feel small and light. Increasing padding, font size, border width, and border radius across the board creates a bolder presence. `--radius` in `:root` plus component-level tweaks in the copied .vue files.

**Color with intent** — replace the neutral gray palette in `:root` and `.dark` with brand colors. Even one or two signature colors applied consistently break the generic look. The oklch values in style.css are the place to do this.

**A few custom details** — one or two bespoke component treatments that no default shadcn site has. A button with a swimming gradient while loading. A card with a subtle hover effect. These don't need to be on every component — two or three signature moments create the impression the whole site was custom-designed.

## Dark mode and shadcn

shadcn components ship with `dark:` utility classes built in. The site uses `@nuxtjs/color-mode` to manage the `.dark` class on `<html>`. When `.dark` is present, the `.dark { ... }` block in `style.css` overrides the CSS custom properties, and every shadcn component using token-based classes (`bg-background`, `text-foreground`, `bg-primary`, etc.) updates automatically. Tailwind's `@custom-variant dark (&:is(.dark *))` makes the `dark:` prefix work. No per-component dark mode work is needed — it's handled by the token system.
