
# Components

Nuxt 4 + Tailwind v4 (via `@tailwindcss/vite`, not `@nuxtjs/tailwindcss`) + shadcn-vue + Reka UI. shadcn-vue is the design layer — pre-styled Vue components built on Reka UI (headless accessible primitives) and Tailwind (utility CSS). The CLI copies `.vue` source files into your repo as source you own — there is no `shadcn-vue` entry in package.json.

## 🍓 Scaffold fresh

From a starting point of Nuxt 4 and Tailwind 4 (`@tailwindcss/vite` in devDependencies), `cd site` and then:

```bash
# Initialize shadcn-vue — creates components.json, app/lib/utils.ts, and CSS theme tokens
pnpm dlx shadcn-vue@latest init --defaults

# Install runtime dependencies
pnpm add reka-ui                       # headless accessible primitives (639 thousand/week)
pnpm add class-variance-authority      # maps variant props to class strings (14 million/week)
pnpm add clsx                          # conditional class joining (48 million/week)
pnpm add tailwind-merge                # deduplicates conflicting Tailwind classes (22 million/week)
pnpm add lucide-vue-next               # icon library, Vue wrapper (550 thousand/week)
pnpm add @vueuse/core                  # Vue composable utilities (5 million/week)
pnpm add tw-animate-css                # animation keyframes for shadcn transitions (6 million/week)

# Install dev dependencies
pnpm add -D typescript                 # required by scaffolded components' lang="ts"

# Add your first component
pnpm dlx shadcn-vue@latest add switch  # shadcn-vue CLI (14 thousand/week) — code generator, not a dependency
```

[shadcn-vue](https://www.npmjs.com/package/shadcn-vue) is a code generator, not a runtime dependency. `pnpm dlx shadcn-vue@latest` downloads temporarily, copies source files into the repo, and exits — it never appears in package.json or sem.yaml. Its 14 thousand weekly downloads just means 14,000 component-add or init events across the ecosystem. The number that represents actual ecosystem health is **reka-ui** (639 thousand/week), which is the runtime dependency your code imports and ships.

`shadcn-vue init` may create `assets/css/main.css` at the project root, but Nuxt 4 uses `app/` as the source root, so `~/assets` resolves to `app/assets/`. Move the file if needed: `mv assets/css/main.css app/assets/css/main.css`. Merge the generated CSS variable blocks (`:root` and `.dark`) into your existing `style.css` rather than keeping a separate file.

Adding most components won't change package.json — the CLI copies .vue files that import from deps already installed. A few specialized components bring their own dependency (Toast pulls `vue-sonner`, Form pulls `vee-validate` and `@vee-validate/zod`), but those are deliberate feature additions.

**Package risk** Five of the seven runtime packages have a single primary maintainer: reka-ui ([Zernonia](https://github.com/zernonia)), tw-animate-css (Wombosvideo), tailwind-merge (Dany Castillo), CVA (Joe Bell), and clsx (Luke Edwards). @vueuse/core is led by Anthony Fu but has a broad contributor base and Vue core team backing. Lucide is maintained by a small core team. None of the seven have corporate backing — no venture-funded pivot risk and no acquisition drama like Radix had on the React side. TypeScript is the exception: Microsoft-backed, 119 million weekly downloads, zero risk.

Of these, only **reka-ui** represents a real risk — it's the most complex package in the set, the most important to the stack, and the one most likely to need active maintenance as the Vue ecosystem evolves. **tw-animate-css** has the thinnest backing (pseudonymous sole maintainer, downloads carried by shadcn adoption) but it's a CSS file you could inline into style.css tomorrow. The other three sole-maintainer packages (tailwind-merge, CVA, clsx) are either finished software that won't need updates or so heavily adopted at tens of millions of weekly downloads that the community would absorb them long before they became a problem.

## Adding a component

Browse available components at https://www.shadcn-vue.com/docs/components
From the `site/` directory (where `components.json` lives — the CLI won't find it from the repo root):

```bash
cd site
pnpm dlx shadcn-vue@latest add radio-group
```

The CLI scaffolds files into `app/components/ui/<component-name>/`. After scaffolding, three cleanup steps:

1. **Delete the barrel file.** The CLI creates an `index.ts` that re-exports the `.vue` files. Nuxt's auto-imports make this unnecessary — Nuxt registers components by filename, not by barrel exports. Delete `index.ts`.

2. **Move the `.vue` files to `app/components/Reka/`.** All scaffolded components live in one flat folder. The capital letter visually distinguishes it from lowercase folders (`small/`, `bars/`, `credentials/`) which are entirely application-defined.

3. **Delete the `ui/` directory.** The CLI recreates `ui/<component-name>/` each time. After moving the files out, delete the empty directory tree. If `ui/` has nothing else in it, delete the whole thing.

The component is auto-imported by Nuxt and available in any template by its filename (e.g., `<RadioGroup>`, `<RadioGroupItem>`).

**If the dev server throws a type resolution error**, the Vue SFC compiler couldn't follow a complex type inheritance chain in reka-ui's type definitions. The error says "Failed to resolve extends base type" and points to a line like `interface RadioGroupItemProps extends Omit<RadioProps, 'checked'> {}`. The fix is adding `/* @vue-ignore */` inside the `defineProps<>` generic in the scaffolded component, before the type that fails to resolve: `defineProps</* @vue-ignore */ RadioGroupItemProps & { ... }>()`. This tells the compiler to skip resolving that type — the component works identically because props are forwarded to the Reka UI primitive at runtime anyway. Most types resolve fine (Switch didn't need this); apply only when the error appears.

**Unique names.** `nuxt.config.js` sets `pathPrefix: false`, meaning Nuxt registers all components by filename alone, ignoring their folder path. A `Reka/Button.vue` and a `small/Button.vue` would both register as `<Button>`, causing ambiguity. Before adding a shadcn component, check that no existing component in the project shares the same filename. The site's `small/Button.vue` is why DarkSwitch uses a raw `<button>` element styled with shadcn utility classes rather than importing shadcn's Button component.

## Files

```
Key files and paths:

site/components.json           — shadcn-vue CLI config (style, TypeScript flag, path aliases)
site/app/lib/utils.ts          — cn() helper used by every shadcn component
site/app/assets/css/style.css  — Tailwind entry, :root and .dark token blocks, @custom-variant
site/app/components/Reka/      — all scaffolded shadcn components live here (Switch, RadioGroup, etc.)

Created by the CLI each time, then cleaned up:
site/app/components/ui/<name>/index.ts  — barrel file, delete (Nuxt auto-imports by filename)
site/app/components/ui/<name>/          — scaffold target, move .vue files to Reka/, delete ui/
```

Each shadcn component is a `.vue` SFC that wraps a Reka UI primitive and applies Tailwind styling. The `cn()` helper (from `app/lib/utils.ts`) merges base classes with any overrides you pass via the `class` prop — it uses `clsx` for conditional joining and `tailwind-merge` for deduplication.

Scaffolded components fall into three structural types. **Accessible stateful controls** like Switch and RadioGroup wrap Reka UI primitives that provide keyboard navigation, focus management, and ARIA attributes — the component file adds Tailwind styling on top. **Styled interactive primitives** like Button wrap a Reka UI `Primitive` element and use CVA (class-variance-authority) to map variant and size props to different class sets — no complex accessibility behavior, just appearance. **Purely structural** components like Card are just styled `<div>`s and headings with no Reka UI dependency at all.

Scaffolded components use `<script setup lang="ts">` and import TypeScript type interfaces from Reka UI for their prop definitions (e.g., `defineProps<RadioGroupRootProps>`). This is the TypeScript/JavaScript boundary — see below.

## TypeScript

`components.json` has `"typescript": true`. This means the CLI scaffolds components with `lang="ts"` and TypeScript-generic `defineProps<>` syntax, which pulls prop definitions from Reka UI's exported type interfaces in a single line. With `"typescript": false`, the CLI enumerates every prop manually in verbose object syntax — same result, much more code.

The boundary is: **`lang="ts"` only inside the `Reka/` folder.** These are scaffolded plumbing files that wrap Reka UI primitives. You rarely read or edit them. The TypeScript buys terse prop declarations and you never have to think about it.

Everything else — your own components, pages, stores, composables, layouts — stays plain `<script setup>` with no `lang="ts"`. The TypeScript never leaks out because shadcn components expose normal Vue props to their consumers. When you write `<RadioGroupItem value="dark" />` in your own component, your component doesn't know or care that RadioGroupItem uses TypeScript internally.

## Dark mode

shadcn components ship with `dark:` utility classes built in. The site uses `@nuxtjs/color-mode` to manage the `.dark` class on `<html>`. When `.dark` is present, the `.dark { ... }` block in `style.css` overrides the CSS custom properties, and every shadcn component using token-based classes (`bg-background`, `text-foreground`, `bg-primary`, etc.) updates automatically. Tailwind's `@custom-variant dark (&:is(.dark *))` makes the `dark:` prefix work. No per-component dark mode work is needed — it's handled by the token system.

# Stack

## The copy-not-install model

Traditional component libraries are npm packages — install, configure through props and theming, bump versions to get fixes. shadcn inverted this: the CLI copies source files into your project, then the connection is severed. No runtime dependency, no version to bump. The philosophy is that libraries impose too much abstraction — you can't see what a `<UButton variant="soft">` actually renders, and when you need something the prop API doesn't support, you're stuck filing an issue or forking.

The upside is total control. You can read every line of every component, change anything — markup, styling, behavior, accessibility attributes — without fighting an abstraction layer. A designer can open Switch.vue and change exactly how it looks. There's no risk of a library update breaking your UI.

The cost is maintenance. If reka-ui ships an accessibility fix for SwitchRoot, shadcn-vue updates its registry, but your copied Switch.vue stays as it was. You'd have to notice the update, re-run the add command, and diff the output against your customized version. Accessibility and behavior bugs can silently accumulate in copied files that nobody re-checks against the upstream registry.

## Packages and ecosystem, comparing Nuxt+Vue to Next.js+React

Our stack has a direct React/Next.js equivalent at every layer. The React ecosystem is roughly 20–100x larger by download count, but the Vue packages are structurally identical and, at most layers, share the same maintainers or codebase. Download numbers below are from February 2026.

**reka-ui** (639 thousand/week) is the one dependency with meaningful risk. It's the headless primitive layer — every shadcn component that does anything interactive (Switch, RadioGroup, Dialog, Dropdown) wraps a Reka UI primitive for keyboard navigation, focus management, and ARIA. Created by Zernonia in 2023 as "Radix Vue," rebranded to Reka UI at v2 in 2025. It's the most complex package in the set, the most actively evolving, and depends on a small core team with no corporate backing.

The React equivalent is **Radix UI** (`@radix-ui/react-slot` at 64 million/week). Created around 2018 by the team at Modulz, a startup founded by Colm Tuite and Stephen Haney. In June 2022, WorkOS (an enterprise SSO/auth API company) acquired Modulz as part of its $80 million Series B. The Radix team joined WorkOS, and the library continued under WorkOS stewardship. It has 18 thousand GitHub stars and massive adoption driven largely by shadcn/ui depending on it. However, after the acquisition many of the original maintainers left WorkOS. Maintenance slowed significantly through 2023-2024, with issues and PRs piling up. Colm Tuite, the co-creator, publicly called Radix "a liability" and "the last option I'd consider for any serious project." The original engineers who left went on to create **Base UI** (under the MUI organization), which reached v1.0 stable in December 2025 — effectively a spiritual successor to Radix by the same people. WorkOS has attempted reinvestment (weekly livestreams, triage efforts in mid-2025), but whether that's sustained remains to be seen. shadcn himself (who joined Vercel in 2023 as a Design Engineer — he is *not* a WorkOS employee) responded measured: Radix is "mature, well-designed, battle-tested and used in millions of production apps" and "code doesn't stop working because maintainers move on." As of January 2026, shadcn/ui officially supports **both Radix and Base UI** as backend primitive libraries, giving React projects an escape hatch.

On the Vue side there is no equivalent escape hatch — Base UI is React-only. Both shadcn-vue and Nuxt UI bet on Reka UI as their sole primitive layer. The mitigating factor is that the Nuxt team depends on it for Nuxt UI, so they have a direct stake in its continued health. The 100x download gap (64 million vs 639 thousand) reflects the React/Vue ecosystem size difference, not a quality or maintenance gap — Reka UI's release cadence is healthy.

**lucide-vue-next** (550 thousand/week) and **tw-animate-css** (6 million/week) are low risk but worth noting. Lucide is the icon library — the pre-1.0 version flag is misleading (0.574 means "574th release," a rolling counter, not an unstable beta). It's a thin Vue wrapper over the same Lucide icon set as lucide-react (26 million/week), maintained by the same organization; if the project went dormant, existing icons would keep working. tw-animate-css provides CSS animation keyframes that shadcn components reference for transitions. It has the thinnest organizational backing (pseudonymous sole maintainer, downloads carried by shadcn adoption), but it's just a CSS file — if it vanished, you could inline the keyframes into style.css and delete the dependency.

The remaining dependencies are effectively zero risk. **tailwind-merge** (22 million/week) needs ongoing maintenance — it must understand Tailwind's class grammar to know that `px-2` and `px-4` conflict — but release cadence is healthy. **clsx** (48 million/week) is 239 bytes, one function, finished software; the 21-month gap since its last release is completion, not neglect. **class-variance-authority** (14 million/week) maps variant props to class strings with no external dependencies; its pre-1.0 and 14-month-old flags simply reflect that there's nothing left to change. **@vueuse/core** (5 million/week) is by Anthony Fu, a Vue core team member at NuxtLabs who maintains much of the Vue/Vite tooling ecosystem — the React side doesn't have a single equivalent; React hooks are scattered across individual packages. **typescript** is a devDependency required by the scaffolded components' `lang="ts"` — Microsoft-backed, no discussion needed. The shared utilities (clsx, tailwind-merge, CVA, tw-animate-css) are framework-agnostic — the React and Vue stacks pull the exact same code.

**Styling** is Tailwind CSS v4 on both sides — same package, same utility classes. Nuxt uses the Vite plugin, Next.js uses the PostCSS plugin path.

**The design layer** — shadcn/ui (React, CLI at 1.3 million/week) and shadcn-vue (Vue) — are both copy-not-install, so download count measures scaffolding activity, not ongoing risk. shadcn-vue is a community port, not first-party. It's well-maintained but trails the React original in component count, documentation depth, and ecosystem momentum. You'll occasionally hit a component that exists in shadcn/ui but not yet in shadcn-vue.

**The frameworks** — next (25 million/week, backed by Vercel) and nuxt (1.2 million/week, backed by NuxtLabs) — are both corporate-backed with large core teams; low risk on either side. The biggest architectural difference: Next.js has React Server Components — components are server-only by default and only ship JavaScript when marked `"use client"`. Nuxt uses classic universal rendering — full hydration of the entire page on the client, every component ships its JS. Vue's answer to the bundle size problem will be Vapor Mode (compilation-based, not yet stable) rather than per-component server/client splitting. For many consumer apps this is perfectly fine, but for very content-heavy pages the client bundle will be larger. The deployment story goes the other way: Nitro gives Nuxt serverless output for Cloudflare Workers, AWS Lambda, etc. out of the box, while Next.js *can* deploy serverless but is most tightly optimized for Vercel.

**Branding and theming** is identical on both sides — CSS custom properties (`--primary`, `--radius`, etc.) for global theming, direct component file edits for brand-specific touches.

# Design

## Three tiers of UI elements

**shadcn components** — the default for all standard user-facing controls: forms, buttons, dialogs, switches, radio groups, cards, dropdowns, etc. You get consistent visual language, built-in accessibility (keyboard nav, ARIA, focus rings), and dark mode through the token system. Every piece of normal UI should use this tier.

**shadcn tokens on raw elements** — for bespoke one-off controls that don't match any standard component. DarkSwitch is the example: a small icon-only toggle that should always look like a quiet neutral square. It has no states, no labeling, no behavior worth wrapping in a component. It applies shadcn's design tokens directly (`border-input`, `bg-background`, `hover:bg-accent`) on a raw `<button>`. It uses the shadcn design system without using a shadcn component, because no component matches what it is.

**Plain HTML with Tailwind** — only for error.vue, which deliberately uses no custom components, no stores, no imports. It has to work when everything else is broken.

## Brand expression on the cheap

shadcn/ui is the new Bootstrap. To an unfamiliar eye it looks clean and professional — neutral colors, consistent spacing, rounded corners, accessible by default. To an experienced eye it looks like every other startup that ran `shadcn init` and shipped the defaults. The same gray palette, the same 0.625rem radius, the same Geist or Inter font stack. It's a good starting point that announces "we haven't started designing yet."

What funded companies do is hire a brand agency — six or seven figures — to create a visual identity system: a proprietary color palette, a custom or licensed typeface, a spacing and radius language, a set of motion principles, illustration and icon guidelines, and a component library that expresses all of these consistently. The deliverable is a Figma system and a set of design tokens that engineering implements. The result is a site that feels like *this company* rather than *a website*.

The challenge is to get that effect without the agency. shadcn's copy-not-install model makes this unusually feasible, because you own every component file and the entire theme is CSS custom properties you can edit directly. The levers:

**Typeface.** The single highest-impact change. The site already has Diatype Rounded and Lemon Wide loaded as custom fonts. Using a distinctive typeface consistently — in headings, buttons, nav, and form labels — immediately separates the site from the shadcn default look. The font stack in `@theme` controls this globally.

**Scale and weight.** Default shadcn components feel small and light. Increasing padding, font size, border width, and border radius across the board — making things bigger, thicker, more confident — creates a bolder presence. This is a CSS variables change: `--radius`, plus component-level padding and font-size tweaks in the copied .vue files.

**Color with intent.** Replace the neutral gray palette in `:root` and `.dark` with brand colors. A distinctive primary, a warm or cool accent, semantic colors (success, warning, destructive) that feel considered rather than default. Even one or two signature colors applied consistently — a specific blue for primary actions, a specific warm tone for backgrounds — break the generic look.

**A few truly custom details.** One or two bespoke component treatments that no shadcn site has. A button with a swimming gradient background while loading. A card with a subtle parallax hover. An input that glows on focus. These don't need to be on every component — two or three signature moments create the impression that the whole site was custom-designed. Because you own the component source, these are just Tailwind classes and CSS transitions in the .vue files.

## Animation

shadcn components ship with `tw-animate-css` animations (fade, slide, scale) on dropdowns, dialogs, tooltips, and popovers. These are tuned for showcase feel, not production speed. The goal is a site that feels instant — cut transition durations in half or remove them. For components like tooltips and dropdowns, consider removing animation entirely. Respect `prefers-reduced-motion` — Tailwind v4 has `motion-safe:` and `motion-reduce:` variants. Any animation we keep should be wrapped in `motion-safe:` so it disappears for users who don't want it.

# Tasks ahead

The site is at the start of a large migration from raw HTML to shadcn components. Bare `<input>` elements, `<select>` boxes, and hand-styled controls across the site will be replaced with shadcn's Input, Select, and other components. Each migration brings consistent styling, dark mode support, and accessibility for free. The `@tailwindcss/forms` plugin (which normalizes bare form elements) can be removed once the last bare input is gone.

**Button is a special case.** The site's `small/Button.vue` is already a substantial, useful component with ~45 usages. It manages three states (ghost/ready/doing), awaits async click handlers, guards against double-clicks, exposes `.click()` and `.post()` methods via `defineExpose`, orchestrates Turnstile tokens, and shows labeling text while doing. None of this behavior exists in shadcn's Button, which is purely an appearance component — CVA maps variant and size props to Tailwind classes, nothing more.

The goal is to get our Button working with shadcn's Button, but the right relationship between the two isn't clear yet. Our Button could wrap shadcn's Button internally, replacing its raw `<button>` element with shadcn's styled one. Or it could extend shadcn's variant map with our states. Or the architecture could be something else entirely. This is a heavyweight task — the most complex single component migration on the site — and the approach needs to be worked out when we get there.

One naming overlap to watch during the Button rebuild: the site's CSS class `.ghost` (gray, disabled-looking) and shadcn's `variant="ghost"` (transparent with hover) mean different things. They don't collide technically (CSS class vs CVA prop), but the confusion is worth cleaning up — rename the site's ghost state to something like `unavailable`.

**NavigateButton.vue** wraps NuxtLink with `my-button ready` classes but has zero usages in the codebase. Delete it.

**No `<form>` elements.** The site uses the SPA pattern: `@keyup.enter="refButton.click()"` on inputs, Button.vue handles state and calls fetchWorker. No `<form>` tag, no `@submit.prevent`, no browser form state. This avoids "Confirm form resubmission?" dialogs, unwanted autocomplete behavior, and POST entries in browser history. This pattern continues as inputs migrate to shadcn components.

**Mobile keyboard hints.** When migrating inputs, preserve `type="tel"` / `type="email"` / `type="url"` to trigger the right mobile keyboard, and use `enterkeyhint="send"` / `"next"` / `"done"` to label the keyboard's Enter key appropriately.

# Alternatives

**[Nuxt UI](https://ui.nuxt.com/docs/components)** is the closest competitor and the only genuinely strong alternative. Built on the same foundation (Reka UI + Tailwind), maintained by the Nuxt team, deeply integrated with Nuxt's module system and DevTools. The difference is philosophical: Nuxt UI is a proper npm dependency you configure through props and theming — install `@nuxt/ui`, register it as a module, use `<UButton>` and `<UCard>`. You don't own the source; you get automatic updates, a higher-level API (app layouts, command palettes, form validation out of the box), and the blessed Nuxt ecosystem path. The tradeoff is you lose the ability to read and modify every line of every component. shadcn-vue made sense for us because it made the stack legible — you can open every component file and see exactly how Reka UI, CVA, and Tailwind compose together. For a production project that wants the most maintained, least-friction path, Nuxt UI (214 thousand downloads/week vs shadcn-vue's 14 thousand) is the stronger bet.

**[PrimeVue](https://primevue.org/)** (419 thousand downloads/week) is the largest Vue component library by download count, with 90+ components, maintained by PrimeTek (a company, not a solo maintainer). The issue is ecosystem lock-in — PrimeVue has its own theming, icons (PrimeIcons), and component API. Their newer "Volt" sub-project copies unstyled components into your codebase (similar to shadcn), but it's tied to PrimeVue's unstyled core as a runtime dependency. You'd be learning and maintaining PrimeVue's abstractions rather than working directly with Tailwind utilities and Reka UI primitives.

**[Naive UI](https://www.naiveui.com/en-US/light/components/button)** (74 thousand downloads/week) is Vue 3-native with 80+ components, TypeScript-first, built-in dark mode. It uses CSS-in-JS theming — no CSS file import at all. Elegant in isolation but fundamentally incompatible with a Tailwind-based workflow. You can't apply `class="px-4 text-sm"` to a Naive UI component and have it work predictably, because styles are generated at runtime through a different system.

**[Ant Design Vue](https://antdv.com/components/button)** (113 thousand downloads/week) is the Vue port of Alibaba's Ant Design system. Enterprise-focused, comprehensive, 50+ components. Uses its own CSS framework (Less/CSS modules), not Tailwind. The design language is deliberately corporate and neutral — optimized for admin dashboards rather than consumer-facing products with a distinctive brand.

**[Vuesax](https://vuesax.com/docs/components/)** (3 thousand downloads/week, last published 5 years ago) is the most visually distinctive library in this list — glassmorphism, gradient borders, fluid animations. But it's Vue 2 only and abandoned. The official Vue 3 rewrite was abandoned at 30% completion. You can't use it, but you can study its design choices and build those effects in shadcn component files using Tailwind's backdrop-blur, gradient, and transition utilities.

# New sections

## Factoring

what's the right way to factor components?
for instance, consider this handful:
<input> plain html single line input
<PasswordBox> current granular component designed to hold a password, with fancy features like the hide/show eye icon control
ok but now we have shadui/cn and reka, which has
<Input>
so i feel like we export from reka, leave that as-is in the Reka folder, and then build our own granular components on top? so maybe two that do this are

Reka/<Input>
Reka/<RekaButton>
small/<Button>

ok so right now, because we made these before we had reka, we have PasswordBox built on plain html input
and Button built on plain html input
and that's fine, but when we add reka to the stack, how do we do it?
not just naming (we'll keep names unique) but as far as depth and factoring of the stack
one way is we don't keep anything in Reka, we add, then steal away, and edit, intentionally
if we later want a newwer version of what comes from Reka, we re-export, and compare, manually
you sorta like this, it's simple and you're in control

alternatively, we could leave reka stuff in reka
or even always prefix them RekaInput
and then make our own Input build on top of that
this is another layer of the stack
and then the idea is when reka updates, you jsut delete the old RekaInput and make a newer better RekaInput
and then fix our Input on top

ok and then thinking about these, which are real world examples you can start trying to accomplish things in to see what works, what's easy, what's brittle
PasswordBox - designed to hold a password
CodeBox - designed to accept a OTP or TOTP code
and then do you set them up with rules
like for CodeBox, good means contains 6 numerals, tell me those 6 numerals
and then they communicate up to tehir parent "things look good"
because the larger form which these controls don't know about will make a button ghosted or clickable depending on that, essentially
how does that work
also because CodeBox, to use that for totp and otp, totp is always 6 digits, while otp is 4 or 6 so green there is 1+ really



we could export reka











# Notes

notesfile




Design Intent Summary
Core Philosophy:
Build components that follow simple, recognizable patterns from Vue/Nuxt best practices—prioritizing function, idiomatic patterns, then clarity. Focus on craftsmanship and learning, not complexity or invention.
Architectural Goals:

Single responsibility: Each component does one thing well
Proper encapsulation: Clear boundaries, minimal coupling
Flexible for unknowns: Works for current demo needs and future use cases we can't predict yet
State management: Pinia stores handle API calls to Nuxt endpoints, state persists as users navigate

Styling Strategy:

Semantic state over visual coupling: Components expose their state (unavailable, clickable, in-flight) via props and data-* attributes, not hardcoded styles
Design-system ready: Using semantic HTML and state attributes means any future styling approach (CSS, Tailwind utilities, component libraries like Vuetify/PrimeVue/Nuxt UI) can hook in without rewriting component logic
Current approach: Stub visual states with simple Tailwind classes for smoke testing, but keep styling separate from logic so designers can replace it later without touching component structure

Right Now:
Focus purely on component tree design, responsibility boundaries, and data flow patterns. Get the factoring right. Styling is temporary scaffolding.



what are your small componenbts now that Button is working so well?

<a> used some places for whole tab navigation
<Navigate> and <NavigateButton> which are just a light wrapper on NuxtLink, with states and styling
<Button> which is both simple and powerful

ok, stuff to check and do and clean up still with small components:

look at and clean up Navigate and NavigateButton
have one that you style with link or not, just like Button does
reproduce that error where when you float over a navigate button, the text goes from white to light something, rather than the button getting lighter
so maybe jsut call this Link

and another thing you need to do in here while you're checking the appearance and states of links adn buttons is have the dangerous visual appearance, the red button for destructive actions






make sure you type things to bring up the right mobile keyboard!
you've been using number pad, but there's also email and url!

<input type="tel" />    <!-- triggers number pad -->
<input type="email" />  <!-- triggers email keyboard -->
<input type="url" />    <!-- triggers URL keyboard with .com key -->





forms
things you'll figure out as you code longer and more complex forms
how does a form work when there are multiple steps?
does icarus have form-wide validation functions, like validateSomeForm(), which both the vue component and api handler can use?



are you going to use <form @submit.prevent="">?
no - don't use <form> element at all. traditional form behavior (even with prevent) means:
- browser adds POST to history
- "Confirm form resubmission?" dialog if user clicks back
- browser "helps" with autocomplete in ways you don't want
instead, the SPA pattern:
- @keyup.enter="refButton.click()" on inputs
- Button.vue handles state and calls fetchWorker
- no browser form state = no resubmission dialog, clean history
this is what Button.vue is designed for





are you going to use <input enterkeyhint="">?
yes - mobile UX enhancement, changes the label on keyboard's Enter key:
<input enterkeyhint="search" />  <!-- key shows "Search" -->
<input enterkeyhint="send" />    <!-- key shows "Send" -->
<input enterkeyhint="next" />    <!-- key shows "Next" (multi-step form) -->
<input enterkeyhint="done" />    <!-- key shows "Done" (final field) -->
<input enterkeyhint="go" />      <!-- key shows "Go" -->
doesn't change functionality, just the visual label. nice UX polish for mobile




```
visually simple--like you drew it all with a thick crayon
- flat--as opposed to shadows, bubbles, shine, any z dimensional cues, accomplish things without those!
- completely communicative--the user knows where the focus is, which fields are valid, what the button can do and is doing
- does not depend upon color--you could use it all with just gray and pink, for instance
- understandably common--boxes have a border all the way around so everyone's mom understands they're a box. unlike Android in the 20teens!

oh wait--if you accomplish these goals with chat and tailwind, does that mean you don't use a prepackaged component library? or you do, but just to get the slider-style checkbox, or something? don't those comonent libraries already come with a password box? so maybe you shouldn't be doing this here yourself, at all!

figure out how you want things to work, then from that make choices about tools and factoring
imagine this step in a form is jsut a box wher the user types their email
they mistakingly type "name.example.com", so, not valid
should the Next button not be clickable until they fix it?
should there be text below that says "That's not a valid email address"?
should that text appear while they're typing? after they blur the box? after they hit submit?
how does that work when you can place the Submit button on the phone keyboard, so they don't have to return focus to the page at all?

if you wire it up so the submit button isn't even clickable until the form contains valid looking information, does that interrupt the user's flow?
(the 1998 way, before client-side validation, is they press submit, and then get errors they have to scroll up to fix, which as an extreme, is also bad
but also also bad is the most modern way, where the user is pecking a nonworking submit button because they haven't correctly typed their email in a box above they're no longer looking at)

should the boxes animate "No" left and right like they do on macOS? is this clever or annoying?
should this be like typeform, a whole bunch of different steps, or like the early web, a long form you spend time getting right before submitting?

you know you want to keep forms short enough that even with the keyboard up, there's no scrolling at all--and this means really, really short--you're already seeing scrolling with navigation links at the top when there's a password box on the page, so the keyboard is taller because there are password manager controls above it!
but you also know you don't want to make the thing a million step conversation the user feels lost in, like when will it end, likek typeform

also remember, most users are going to be able to fill out these forms, no problem
so don't choose a design that gets in their way, or is distracting, or just even a little weird, as they're doing that!

maybe dashed means undone, so you go to the form and all the boxes and teh button are dashed
and then as you complete things, making them valid, they become solid
until at last the button is also solid
ok so then how do you show where the focus is?
maybe with the accent color

the dashed border looks weird and bad in firefox, maybe try a dotted border?
remember to deploy to see what this looks like on mobile, both ios and android!

another thing to do here now is style a button alongside these boxes
and work on the button's animated state, which probably has an ellipsis that blinks ., .., ...
and maybe also a gently swimming wallpaper background--you like this because it's calm, immediate, unique, and does not revert (like progress that shrinks) nor appear possibly endless (like all the spinners)

all the text the user types should be monospace, like Noto Sans Mono
when they write a post, even, it's mono
when it's rendered on the page it's in the brand font
hook that up for these controls

do these hold a line of status or help or error text beneath them
like "Got that as US +1 987 555 124" for phone number
or "Prosessing for 5 seconds..." on a slow POST

simple idea for the crayon design
as a visual communication of brand, though, this may be too distinctive
highly usable, but look underdeveloped, retro, rudimentary, less than current or professional

inputs and buttons look a lot alike, buttons have text in them, buttons are solid
dashed always means not valid, solid always means valid
dashed box means blank or that's not an email address
dashed button means you haven't gotten this form submittable yet
the accent color (pink, not gray) means that thing has the focus

and then all you have to figure out is what the Submitting... animation is for buttons
ideas include
the dots of the button jiggle slightly
there's a regular spinner in front of the text
the ellipsis grows and blinks (do this in addition to things; or maybe this is really all you need)
the button text changes from Submit to Submitting... (did this)
there's a striped or arrowed or sprinkley background to the button, which lazily drifts to the right (you like this)

in all this, also note that firefox dashes look horrible because they're not all the same width
how do their dots look?

ok, if you were deciding right now, you'd
use dashes, even though firefox's are bad; most people will be on chrome
inputs are open, buttons are filled
pink is focused, gray is blurred
solid is valid or clickable, dashed is not
submitting animation is changing the word to "ing" and adding "..." which blinks rapidly, and grows quickly, before resetting

and this is all the animatino you need as you're building this thing so there's never a wait more than a second
ok, yeah, this meets your crayon requirement
is really simple, both visually, and to code

maybe you can code your own inputs and buttons easily
but they look too kindergarten, too Yoshi's Wolly World
and for that reason you bring in a look from a vue tailwind component library

or maybe you just bring in the library to get the mobile-style checkbox ((x) ) that thing

oh, can you set the placeholder text in one font and color (diatype, gray)
and the text the user types in another (noto sans mono, black)
is that easy, or does that involve changing the style of the contained text if the contents are blank or not?
```










