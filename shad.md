
# shadcn/ui in Nuxt

Reference document for adding shadcn-vue to an existing Nuxt 4 + Tailwind v4 project. Covers scaffolding steps, gotchas, dependency audit, and integration decisions. Originally written while evaluating shadcn across both Next.js and Nuxt stacks.

## Scaffolding reference

To begin, here are some steps to scaffold shadcn/ui in Next.js

```bash
pnpm create next-app next
cd next
pnpm dlx shadcn@latest init --defaults
pnpm dlx shadcn@latest add button switch card
```
The init step writes `components.json` and `lib/utils.ts`, updates `app/globals.css` with CSS variable theming, and installs runtime dependencies (radix-ui, class-variance-authority, clsx, tailwind-merge, lucide-react, tw-animate-css). The CLI adds itself as a local devDependency. Component files land in `components/ui/` as source you own.

Compare to shadcn-vue in Nuxt:

```bash
pnpm add -D tailwindcss @tailwindcss/vite
pnpm dlx shadcn-vue@latest init --defaults
pnpm dlx shadcn-vue@latest add button switch card
```
After the first add, wire into `nuxt.config.ts` with `vite: { plugins: [tailwindcss()] }` and `css: ['~/assets/css/main.css']`, then create `app/assets/css/main.css` with `@import "tailwindcss"`. The init step writes `components.json` and `app/lib/utils.ts`, updates the CSS file with theme variables, and installs runtime dependencies (reka-ui, class-variance-authority, clsx, tailwind-merge, lucide-vue-next, @vueuse/core, tw-animate-css). Unlike the React side, the shadcn-vue CLI is not installed locally — it runs via `pnpm dlx` each time. Component files (`.vue`) land in `app/components/ui/`.

shadcn-vue init may create `assets/css/main.css` at the project root, but Nuxt 4 uses `app/` as the source root, so `~/assets` resolves to `app/assets/`. Move the file if needed: `mv assets/css/main.css app/assets/css/main.css`. Also, watch out for overlapping component names: Nuxt auto-imports see both `Button.vue` and `index.ts` in the same dir and warn about duplicate component names. Harmless — we import explicitly.

### Component patterns

shadcn components fall into three patterns. *Button* is a styled interactive primitive — wraps a Reka UI `Primitive` element and adds variant/size props through CVA. *Switch* is an accessible stateful control — wraps Reka UI's `SwitchRoot` and `SwitchThumb` for keyboard support, ARIA attributes, and focus management. *Card* is purely structural — styled `<div>`s and headings with no headless-UI dependency. These range from headless-primitive wrappers to plain layout containers.

## Background

Modern React frontend stack:

* **Next.js** (App Router) — the framework. Handles routing, server rendering, and the React Server Components architecture where components are server-only by default and only ship JavaScript to the client when explicitly marked with `"use client"`.

* **Tailwind CSS v4** — the styling system. Utility-first CSS classes applied directly in markup. No component logic, just a way to style things. CSS-first configuration, Rust-powered build engine.

* **Radix UI** — the headless component library. Provides accessible, unstyled interactive primitives (dialogs, dropdowns, tooltips, etc.) that handle keyboard navigation, focus management, and ARIA compliance. You don't typically interact with it directly.

* **shadcn/ui** — the design layer. Pre-styled components built on Radix + Tailwind that get copied into your project as source code you own. Gives you a clean, modern, consistent look out of the box.

* **Branding and theming** — shadcn/ui's visual identity is driven by CSS custom properties (`--primary`, `--secondary`, `--accent`, `--radius`, etc.) defined in your global CSS. Applying a brand means swapping these values to your own colors, adjusting corner radius and typography, and optionally editing individual component files for more distinctive touches like custom hover effects or shadow treatments. Because the components are source code you own rather than a packaged dependency, there's no abstraction barrier — you can modify anything from global tokens down to individual component markup.

Tailwind handles all visual styling. Radix handles interactive behavior and accessibility. shadcn/ui composes the two into ready-made components. Next.js orchestrates everything with server/client rendering. You customize the look through CSS variables for global consistency and direct component edits for brand-specific details.

Compare to a modern Vue/Nuxt frontend stack:

* **Nuxt 4** — the framework. Handles routing, universal server rendering (classic model: server renders first page, client hydrates, then SPA navigation). Deploys serverless via Nitro to Cloudflare Workers, Vercel, Netlify, etc. No React Server Components equivalent — Vue's approach to the bundle size problem will come through Vapor Mode (compilation-based, not yet stable) rather than per-component server/client splitting.

* **Tailwind CSS v4** — identical. Same styling system, same utility classes, same CSS-first config. Works via Vite plugin, which is Nuxt's native build tool, so the integration is actually slightly cleaner than Next.js (which uses the PostCSS plugin path).

* **Reka UI** — the headless component library. This is the Vue equivalent of Radix. It was originally called Radix Vue (a community port), then rebranded to Reka UI for its v2 release. Same concept: accessible, unstyled primitives for dialogs, dropdowns, tooltips, etc. Reka UI is inspired by the principles and goals of Radix UI, sharing a commitment to accessibility, customization, and developer-friendly design.

* **shadcn-vue** — the design layer. Community port of shadcn/ui for Vue, built on Reka UI + Tailwind. Same copy-into-your-project model, same CSS variable theming, same visual aesthetic. As of the latest version, the `shadcn-vue@latest` command installs Reka UI by default. There's also a dedicated `shadcn-nuxt` module that handles auto-imports.

* **Branding and theming** — same approach as the React stack. CSS custom properties (`--primary`, `--radius`, etc.) for global theming, direct component file edits for brand-specific touches.

The rendering model is the biggest difference. Nuxt 4 uses classic universal rendering — full hydration of the entire page on the client. Every component ships its JavaScript. You don't get RSC's selective hydration or the "server components never ship JS" benefit. For many consumer apps this is perfectly fine, but for very content-heavy pages the client bundle will be larger.

The ecosystem maturity is the second difference. shadcn-vue and Reka UI are community-driven ports, not first-party. They're well-maintained and Evan You himself has endorsed them, but they trail the React originals in component count, documentation depth, and ecosystem momentum. You'll occasionally hit a component that exists in shadcn/ui but not yet in shadcn-vue.

The deployment story is arguably better with Nuxt — Nitro gives you serverless output for Cloudflare Workers, AWS Lambda, etc. out of the box. Next.js *can* deploy serverless but is most tightly optimized for Vercel.

So the stack is structurally the same pattern, just with Vue equivalents at each layer, a simpler rendering model, and a serverless-first deployment story.

### Headless UI ecosystem

Next.js gets Radix UI, Nuxt gets Reka UI. These solve the same problem: building interactive UI controls (dialogs, dropdowns, switches, tooltips) that are accessible out of the box — keyboard navigation, focus trapping, ARIA attributes, screen reader announcements — without imposing any visual design. They're "headless" because they handle behavior and accessibility but have zero styling. You never interact with these directly in application code; shadcn's generated components wrap them and add styling.

**Radix UI** was created around 2018 by the team at Modulz, a startup founded by Colm Tuite and Stephen Haney. In June 2022, WorkOS (an enterprise SSO/auth API company) acquired Modulz as part of its $80M Series B. The Radix team joined WorkOS, and the library continued under WorkOS stewardship. It has ~18.5k GitHub stars and the most-used package (`@radix-ui/react-slot`) sees ~18M weekly npm downloads — massive adoption driven largely by shadcn/ui depending on it.

However, Radix has a complicated recent history. After the acquisition, many of the original maintainers left WorkOS. Maintenance slowed significantly through 2023-2024, with issues and PRs piling up. Colm Tuite, the co-creator, publicly called Radix "a liability" and "the last option I'd consider for any serious project." The original engineers who left went on to create **Base UI** (under the MUI organization), which reached v1.0 stable in December 2025 — effectively a spiritual successor to Radix by the same people. WorkOS has attempted reinvestment (weekly livestreams, triage efforts in mid-2025), but whether that's sustained remains to be seen.

Notably, shadcn himself (who joined Vercel in 2023 as a Design Engineer — he is *not* a WorkOS employee) responded measured: Radix is "mature, well-designed, battle-tested and used in millions of production apps" and "code doesn't stop working because maintainers move on." As of January 2026, shadcn/ui officially supports **both Radix and Base UI** as backend primitive libraries, giving projects an escape hatch if Radix maintenance doesn't improve.

**Reka UI** is the Vue equivalent — created as "Radix Vue" in 2023, rebranded at v2 in 2025. It has no corporate backer and no React-side drama. The full origin story and risk profile are in the dependency audit below. One important ecosystem note: Base UI is React-only, so there is no Vue equivalent of the Radix-to-Base-UI escape hatch. Both shadcn-vue and Nuxt UI bet on Reka UI as their sole primitive layer.

### The copy-not-install model

Before shadcn, component libraries were npm packages. You `npm install` a library like Material UI or Vuetify, import its components, and configure them through props and theming. When the library ships a fix or a new feature, you bump the version and get it. The library owns the code; you own the configuration.

shadcn invented (or at least popularized) a different pattern: the CLI copies component source files into your project and then the connection to the registry is severed. `pnpm dlx shadcn-vue@latest add switch` downloads a Switch.vue, drops it into your `components/ui/` directory, and exits. That file is now yours — plain source code in your repo, no different from a component you wrote yourself. There is no `shadcn-vue` entry in your runtime dependencies. There is no version to bump. The CLI is a delivery mechanism, not a dependency.

This is a shadcn-specific idea. It's not a Tailwind thing (Tailwind is just the styling system the copied files use), not a Vue or React thing (both sides work the same way), and not a reka-ui thing (reka-ui is a normal npm package that updates traditionally). The pattern exists because shadcn's creator believed component libraries impose too much abstraction: you can't easily see what a `<UButton variant="soft">` actually renders, and when you need it to do something the prop API doesn't support, you're stuck filing an issue or forking.

**Why it's better:** Total control. You can read every line of every component. You can change anything — markup, styling, behavior, accessibility attributes — without fighting an abstraction layer. You can delete components you don't use. You can move files wherever you want. There's no risk of a library update breaking your UI, because there are no library updates. For teams building a distinctive visual identity, this matters: a designer can open Switch.vue and change exactly how it looks and animates, without learning a theme API or overriding CSS variables through an indirection layer.

**Why it could be worse:** You're responsible for maintenance. If reka-ui ships an accessibility fix for SwitchRoot, shadcn-vue will update its registry to use it, but your copied Switch.vue stays as it was the day you added it. You'd have to notice the update, re-run the add command, and diff the new output against your (possibly customized) version. For a team without frontend expertise, this means accessibility and behavior bugs can silently accumulate. Traditional component libraries handle this for you — bump the version, get the fix. The copy model also means every project has its own slightly different copy of every component, which makes knowledge less transferable across teams and projects.

### shadcn-vue vs Nuxt UI

For Nuxt, the two realistic options for a component/UI layer are **shadcn-vue** and **Nuxt UI** — both built on Reka UI + Tailwind. A third option is **Ark UI** from the Chakra UI team, which uses Zag.js (framework-agnostic state machines) instead of Reka UI and has a Vue adapter — the only path that avoids a Reka UI dependency entirely.

The stack we scaffolded — Nuxt + Tailwind + shadcn-vue — mirrors the React side as closely as possible. You run `shadcn-vue add button`, a `.vue` file lands in your `components/ui/` directory, and it's yours. You can read every line, modify anything, and there's no version to upgrade — the component is just source code in your repo. Your project doesn't *depend on* shadcn-vue at runtime; it just used the CLI once to generate files. The tradeoff is that you're responsible for those files — if shadcn-vue ships an improved Button next month, you don't get it automatically.

Nuxt UI takes a different approach. It's a proper npm dependency — you install `@nuxt/ui`, register it as a Nuxt module, and use components like `<UButton>` and `<UCard>` directly. You don't own the source; you configure behavior through props and theming. It's higher-level: Nuxt UI includes app layouts, navigation menus, command palettes, and form validation out of the box. It's also deeper integrated with Nuxt — auto-imports work seamlessly, the module hooks into Nuxt's build system, and the Nuxt DevTools know about it. When the Nuxt team ships a new version, you upgrade the package and get improvements (and potentially breaking changes).

Under the hood, they share the same foundation. Both use Reka UI for headless primitives and Tailwind for styling. Both use the same CSS variable theming system. A `<Button>` from shadcn-vue and a `<UButton>` from Nuxt UI are doing fundamentally the same thing — wrapping a Reka UI primitive, applying Tailwind classes through CVA variants, and respecting your theme tokens. The difference is ownership and abstraction level.

shadcn-vue makes sense when you want maximum control over your component code — when you'll be customizing components heavily, when you want to understand every line of your UI layer, or when you're building something with a distinctive visual identity that doesn't fit neatly into a configurable theme system. Nuxt UI makes sense when you want to move fast on a maintained, well-integrated path — configure through props rather than edit source, get accessibility updates and bug fixes automatically, and stay in the blessed Nuxt ecosystem.

For our purposes — evaluating the scaffolding steps and understanding the layers — shadcn-vue was the right choice. It made the stack legible: you can open every component file and see exactly how Reka UI, CVA, and Tailwind compose together. Nuxt UI would have hidden all of that behind a module registration and prop-driven API. But for a production Nuxt project where you want the most maintained, least-friction path, Nuxt UI (at 214K downloads/week vs shadcn-vue's 47K) is the stronger bet.

## Integration decisions

shadcn-vue is integrated into the site workspace. CSS theme tokens merged into style.css, components.json and lib/utils.ts created, all runtime dependencies installed, first component (Switch) working end to end. What follows are decisions made during integration that need to be revisited as the site evolves.

**`@tailwindcss/forms` — keep for now, remove later.** The forms plugin normalizes bare `<input>` elements to look consistent cross-browser and respond to Tailwind utilities. The site has ~16 bare `<input>` elements across ChooseNameForm, SignInForm, PasswordBox, OtpRequestComponent, TotpDemo, and others. Without the plugin, these would revert to platform-native styling. shadcn's `<Input>` component styles itself from scratch via Reka UI + Tailwind classes, making the plugin redundant for any form element that migrates to a shadcn component. Plan: keep `@plugin "@tailwindcss/forms"` until existing forms are migrated to shadcn components, then remove it and the `@tailwindcss/forms` devDependency.

**Global link styles — keep hardcoded colors for now, migrate to semantic tokens later.** The site has global `a` styles using hardcoded Tailwind colors (text-blue-600, text-purple-600, etc.). These work alongside shadcn — no conflict — but they won't respond to dark mode or theme changes. To make them dark-mode-ready, swap to semantic tokens: `text-primary` for links, `text-muted-foreground` for visited, `text-destructive` for active, with `/70` opacity for hover states. This loses the blue/purple identity and takes on the neutral palette. Alternatively, define custom `--link`/`--link-visited` CSS variables with light and dark values for branded link colors that still respond to theme switching.

**Existing component classes (`.my-button`, `.ghost`, `.ready`, `.doing`, `.my-link`) — keep entirely.** 44 occurrences across 17 files. The three-state pattern (ghost/ready/doing = disabled/available/in-progress) has no shadcn equivalent. One name to watch: shadcn's Button has `variant="ghost"` which resolves to hover classes via CVA, while the site's `.ghost` CSS class applies `bg-gray-400`. These won't collide in practice (variant prop vs CSS class), but avoid putting both on the same element. Eventually, migrate page-by-page: replace `my-button`/`my-link` usage with shadcn `<Button>` variants, and express the three-state pattern as custom shadcn variants or a composable that selects the right variant prop.

**Button naming collision — resolve before using shadcn Button.** The site has `components/small/Button.vue` (16 usages, handles three-state ghost/ready/doing + async click + turnstile) and shadcn would add `components/ui/button/Button.vue`. With `pathPrefix: false` in nuxt.config, Nuxt's auto-import registers both as just `<Button>`, causing ambiguity. The simplest fix: use explicit imports for shadcn components (`import { Button } from '~/components/ui/button'`) in any file that needs them, leaving the existing auto-imported `<Button>` untouched. This requires zero changes to existing code. Alternative approaches: rename the existing Button (16-file migration), or re-enable `pathPrefix: true` (changes all auto-import names sitewide). Resolve this before the first page that needs a shadcn Button.

## New dependency audit

Adding shadcn-vue to the site introduced seven new entries in sem.yaml: six runtime dependencies and one devDependency. No new package has fewer than six-figure weekly downloads, and three are in the eight-figure range. None are deep transitive dependency trees pulling in dozens of sub-packages; they're all leaf-level libraries that do one thing. Here's the case file on each, ordered from most to least risk.

**lucide-vue-next (559,102 downloads; Low risk)**
```yaml
  lucide-vue-next:
    homepage: https://lucide.dev
    description: A Lucide icon library package for Vue 3 applications.
    versions: ^0.574.0 on 2026feb17 0m old 🐣 Pre-1.0 version installed
```
Icon library. Vue 3 icon components from the Lucide project (a community fork of Feather Icons). The download count looks small next to the framework-agnostic packages in this list, but it's the Vue slice of the dominant icon library — Lucide ships framework packages for React, Vue, Svelte, Angular, and others from the same monorepo (lucide-icons/lucide on GitHub, 12K+ stars), and the React version alone does millions more. The "pre-1.0" flag is misleading: Lucide uses the minor version as a rolling release counter, bumping it with every batch of new icons — version 0.574 means "574th release," not "unstable beta." The Vue package is a thin wrapper that generates a `.vue` component per icon — low surface area. If Lucide went dormant, existing icons would keep working; you'd just stop getting new ones. Icons are a leaf dependency — nothing else in the stack depends on Lucide.

**reka-ui (648,108 downloads; Moderate risk)**
```yaml
  reka-ui:
    homepage: https://github.com/unovue/reka-ui
    description: Vue port for Radix UI Primitives.
    versions: ^2.8.0 on 2026jan28 0m old
```
Headless primitive layer: accessible, unstyled interactive components (switch, dialog, dropdown, tooltip) that handle keyboard navigation, focus trapping, and ARIA attributes. Every shadcn component that does anything interactive wraps a Reka UI primitive. Created by Zernonia (Malaysian frontend developer) in 2023 as "Radix Vue", rebranded to Reka UI at v2 in Feb 2025. This is the highest-risk new dependency. It's the most complex of the seven, the most actively evolving, and it has the smallest team relative to its scope — a small core around Zernonia, no corporate backing. The mitigating factor is that Nuxt UI (the official Nuxt component library) depends on Reka UI as its primitive layer, so the Nuxt team has a direct stake in its continued health. That downstream dependency and 190+ contributors provide some insurance, but the project's dependence on a single primary maintainer is a real risk. Actively maintained with frequent releases as of today.

**@vueuse/core (5,215,878 downloads)**
```yaml
  "@vueuse/core":
    homepage: https://github.com/vueuse/vueuse#readme
    description: Collection of essential Vue Composition Utilities
    versions: ^14.2.1 on 2026feb10 0m old
```
Vue composition utilities: reactive helpers, browser API wrappers, and the specific functions (`reactiveOmit`, etc.) that shadcn-vue's generated components use for prop forwarding. By Anthony Fu, a Vue core team member who works at NuxtLabs and maintains a large number of foundational Vue/Vite ecosystem packages (Vitest, UnoCSS, Slidev, unplugin, and more). Deeply embedded in the Vue ecosystem. Anthony Fu is still one person, so there's theoretically a single-maintainer risk, but vueuse has many contributors and the Vue core team has institutional interest in it continuing. The lowest-risk dependency in this list by a wide margin.

**tw-animate-css (5,809,004 downloads; Low risk)**
```yaml
  tw-animate-css:
    homepage: https://github.com/Wombosvideo/tw-animate-css#readme
    description: TailwindCSS v4.0 compatible replacement for `tailwindcss-animate`.
    versions: ^1.4.0 on 2025sep24 4m old
```
devDependency — CSS animation utilities for Tailwind v4, a replacement for `tailwindcss-animate` which only supported Tailwind v3. By Wombosvideo on GitHub, a pseudonymous individual maintainer — the thinnest organizational backing of anything in this list. It's a devDependency because it's a CSS import (`@import "tw-animate-css"` in style.css) that provides keyframe animations shadcn components reference for transitions like fade, slide, and scale. The downloads are almost certainly carried by shadcn adoption rather than independent demand. The saving grace is that the package is essentially a CSS file — no JavaScript runtime, no complex logic. If the maintainer vanished, you could inline the keyframes into your own stylesheet and delete the dependency entirely.

**class-variance-authority (14,234,458 downloads)**
```yaml
  class-variance-authority:
    homepage: https://github.com/joe-bell/cva#readme
    description: Class Variance Authority
    versions: ^0.7.1 on 2024nov26 14m old 🕰️ Installed version 1+ year old 🐣 Pre-1.0 version installed
```
Component variant resolver (CVA). Defines component variants as typed maps: this is how a Button knows that `variant="destructive"` means one set of classes and `size="sm"` means another. By Joe Bell, individual maintainer. Both sem.yaml flags lit up (14 months old, pre-1.0), but neither is concerning here — the flags look alarming until you see what the package actually is: one function that takes a variants config object and returns a class-string resolver. The API surface is tiny, there are no external dependencies, and CVA doesn't know about Tailwind — it just concatenates strings, so there's nothing for Tailwind v4 to break. This is a package that doesn't need frequent releases because there's very little left to change. If it were abandoned tomorrow, 0.7.1 would keep working indefinitely.

**tailwind-merge (22,247,382 downloads)**
```yaml
  tailwind-merge:
    homepage: https://github.com/dcastil/tailwind-merge
    description: Merge Tailwind CSS classes without style conflicts
    versions: ^3.4.1 on 2026feb15 0m old
```
Tailwind class deduplicator. If a component has `px-2` in its base styles and you pass `px-4` as an override, tailwind-merge knows these conflict and keeps only `px-4`. By Dany Castillo (dcastil), individual maintainer. Unlike clsx and CVA, tailwind-merge has to understand Tailwind's class grammar — it needs to know that `px-2` and `px-4` conflict but `px-2` and `py-4` don't. This makes it the one dependency in the list that needs ongoing maintenance: when Tailwind adds new utilities, tailwind-merge needs to learn them. The v3 major was specifically for Tailwind v4 support. Release cadence is healthy — multiple releases per month through 2025-2026.

**clsx (49,310,969 downloads)**
```yaml
  clsx:
    homepage: https://github.com/lukeed/clsx#readme
    description: A tiny (239B) utility for constructing className strings conditionally.
    versions: ^2.1.1 on 2024apr23 21m old 🕰️ Installed version 1+ year old
```
Conditional class string builder: `clsx("base", isActive && "active")` returns `"base active"`. By Luke Edwards (lukeed), a prolific open-source author known for tiny, single-purpose packages. The package is 239 bytes. The API is one function. There is nothing to maintain, nothing to break, nothing to update. The 21-month gap since the last release isn't neglect, it's completion. This is what a finished package looks like.

### Summary

Five of the seven packages have a single primary maintainer: reka-ui (Zernonia), tw-animate-css (Wombosvideo), tailwind-merge (Dany Castillo), CVA (Joe Bell), and clsx (Luke Edwards). @vueuse/core is led by Anthony Fu but has broad contributor base and Vue core team backing. Lucide is maintained by a small core team. Of these, only reka-ui represents a real risk — it's the most complex package in the list, the most important to the stack, and the one most likely to need active maintenance as the Vue ecosystem evolves. tw-animate-css has the thinnest backing (pseudonymous sole maintainer, downloads carried by shadcn) but it's a CSS file you could inline tomorrow. The other three sole-maintainer packages (tailwind-merge, CVA, clsx) are either finished software that won't need updates or so heavily adopted at tens of millions of weekly downloads that the community would absorb them long before they became a problem.

None of these seven have corporate backing — which means no venture-funded pivot risk and no acquisition drama like Radix had on the React side.

## Package management: what's settled, what's left

The shadcn infrastructure is now fully installed. The six runtime dependencies in site's package.json (reka-ui, class-variance-authority, clsx, tailwind-merge, lucide-vue-next, @vueuse/core) plus tw-animate-css as a devDependency cover everything that the vast majority of shadcn components need.

**Adding most components won't change package.json.** Running `pnpm dlx shadcn-vue@latest add card` (or dialog, dropdown, tabs, sheet, alert, etc.) copies .vue source files into the repo. Those files import from the deps already installed. No new packages.

**A few specialized components bring their own dependency.** Toast pulls in `vue-sonner`. Form pulls in `vee-validate` and `@vee-validate/zod`. Charts would pull in a charting library. These are deliberate feature additions, not infrastructure churn — one or two new packages at the point you decide to use that component.

**Design and branding work has zero package impact.** A designer customizing the visual identity edits CSS values (`:root` color tokens, font stacks) and component templates. No packages added or changed.

**The `pnpm dlx shadcn-vue@latest` command is a code generator, not a dependency.** It downloads temporarily, copies source files into the repo, and exits. Same pattern as `nuxi init` or `create-next-app` — a scaffolding tool, not a runtime concern. It will never appear in package.json or sem.yaml.

**Remaining sem.yaml changes are subtractive.** Deleting shad4next and shad4nuxt removes scaffold-only entries (radix-ui, react, react-dom, next, shadcn, @types/react, eslint, typescript, etc.). Later, when forms migrate to shadcn components, @tailwindcss/forms gets removed. The dependency surface gets smaller from here, not larger.
