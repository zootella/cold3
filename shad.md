
# shadcn/ui in Next.js and Nuxt

This is an experiment scaffolding to shadcn with two mainstream stacks: Next.js, and Nuxt. The purpose is to evaluate the steps and modules. Our goal is to define and document scaffolding steps, and demonstrate that a simple hello world works on both sides.

As an example, consider a pnpm monorepo with two workspaces:

```
./shade.md - this document
./package.json - monorepo root
./next/package.json
./nuxt/package.json
```

We're using pnpm 10.28.2 and Tailwind v4.

---

## Steps

### Scaffold Next.js

Run `create-next-app` into the `next/` workspace directory. It will prompt you interactively — choose TypeScript, Tailwind, ESLint, App Router, `@/*` import alias, and decline React Compiler.

```bash
pnpm create next-app next
```

If running inside a monorepo, clean up the lockfile and workspace config that `create-next-app` generates (they conflict with the monorepo root):

```bash
rm next/pnpm-lock.yaml next/pnpm-workspace.yaml
pnpm install
```

Verify: `pnpm --filter next dev` should serve the stock Next.js page on localhost:3000.

### Init shadcn/ui in Next.js

From inside the `next/` directory:

```bash
cd next
pnpm dlx shadcn@latest init --defaults
pnpm dlx shadcn@latest add button switch card
```

`init` detects Next.js + Tailwind v4, writes `components.json` and `lib/utils.ts`, updates `app/globals.css` with CSS variable theming, and installs runtime dependencies (radix-ui, class-variance-authority, clsx, tailwind-merge, lucide-react, tw-animate-css). It also adds the shadcn CLI itself as a local devDependency.

`add button switch card` copies component source files into `components/ui/` — one `.tsx` file per component. These are yours to edit.

Verify: `pnpm --filter next build` should compile cleanly.

### Scaffold Nuxt

Scaffold Nuxt into the `nuxt/` workspace directory using `nuxi init`. Choose the minimal template, decline module browsing.

If running inside a monorepo, you may need to approve native build scripts that pnpm 10 blocks by default. Add `onlyBuiltDependencies` to the root `package.json`:

```json
"pnpm": {
  "onlyBuiltDependencies": ["esbuild", "@parcel/watcher", "sharp", "unrs-resolver"]
}
```

Then `pnpm install` from the monorepo root. Verify: `cd nuxt && pnpm dev` should serve the stock Nuxt welcome page.

### Get Tailwind v4 in Nuxt

From inside the `nuxt/` directory, install Tailwind v4 via the Vite plugin (not PostCSS — Nuxt is Vite-native):

```bash
cd nuxt
pnpm add -D tailwindcss @tailwindcss/vite
```

Wire Tailwind into `nuxt.config.ts`:

```ts
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  css: ['~/assets/css/main.css'],
})
```

Create `app/assets/css/main.css` with `@import "tailwindcss";`.

### Init shadcn-vue in Nuxt

From inside the `nuxt/` directory:

```bash
pnpm dlx shadcn-vue@latest init --defaults
pnpm dlx shadcn-vue@latest add button switch card
```

`init` detects Nuxt 4 + Tailwind v4, writes `components.json` and `app/lib/utils.ts`, updates the CSS file with theme variables, and installs runtime dependencies (reka-ui, class-variance-authority, clsx, tailwind-merge, lucide-vue-next, @vueuse/core, tw-animate-css). Unlike the React side, the shadcn-vue CLI is not installed locally — it runs via `pnpm dlx` each time.

`add button switch card` copies 12 `.vue` source files into `app/components/ui/`. No new dependencies — the runtime packages from `init` already cover everything. These files are yours to edit.

**Gotcha — CSS path in Nuxt 4:** shadcn-vue init may create `assets/css/main.css` at the project root, but Nuxt 4 uses `app/` as the source root, so `~/assets` resolves to `app/assets/`. Move the file if needed: `mv assets/css/main.css app/assets/css/main.css`

**Gotcha — component name warnings:** Nuxt auto-imports see both `Button.vue` and `index.ts` in the same dir and warn about duplicate component names. Harmless — we import explicitly.

Verify: `pnpm --filter nuxt build` should compile cleanly.

## Results

### Package.json comparison

```jsonc
{
  "name": "next",
  "dependencies": {

    // FRAMEWORK — create-next-app
    "next": "16.1.6",                      // the framework itself
    "react": "19.2.3",                     // framework: React runtime
    "react-dom": "19.2.3",                // framework: React DOM renderer

    // HEADLESS UI — added by shadcn init
    "radix-ui": "^1.4.3",                 // headless ui: accessible unstyled primitives (dialog, switch, slot, etc.)

    // SHADCN PLUMBING — added by shadcn init, used inside every generated component
    "class-variance-authority": "^0.7.1",  // shadcn plumbing: defines component variants (size, color) as typed maps
    "clsx": "^2.1.1",                      // shadcn plumbing: builds className strings from conditionals
    "tailwind-merge": "^3.4.1",            // shadcn plumbing: deduplicates conflicting tailwind classes (e.g. px-2 + px-4 → px-4)
    "lucide-react": "^0.564.0"             // shadcn plumbing: icon set used by generated components
  },
  "devDependencies": {
    // STYLING — tailwind v4 via PostCSS (Next.js path)
    "tailwindcss": "^4",                   // styling: the tailwind engine
    "@tailwindcss/postcss": "^4",          // styling: PostCSS plugin that wires tailwind into Next.js build
    "tw-animate-css": "^1.4.0",            // styling: animation utilities for tailwind v4 (added by shadcn init)

    // TOOLING — create-next-app
    "typescript": "^5",                    // tooling: TypeScript compiler
    "@types/node": "^20",                  // tooling: Node.js type definitions
    "@types/react": "^19",                 // tooling: React type definitions
    "@types/react-dom": "^19",             // tooling: React DOM type definitions
    "eslint": "^9",                        // tooling: linter
    "eslint-config-next": "16.1.6",        // tooling: Next.js ESLint rules

    // CLI — added by shadcn init
    "shadcn": "^3.8.4"                     // cli: the shadcn CLI (adds components, manages config)
  }
}
```

```jsonc
{
  "name": "nuxt",
  "dependencies": {

    // FRAMEWORK — nuxi init
    "nuxt": "^4.3.1",                     // the framework itself (includes vue compiler, nitro server, vite)
    "vue": "^3.5.28",                      // framework: Vue runtime
    "vue-router": "^4.6.4",               // framework: Vue router

    // HEADLESS UI — added by shadcn-vue init
    "reka-ui": "^2.8.0",                  // headless ui: Vue equivalent of Radix (accessible unstyled primitives)

    // SHADCN PLUMBING — added by shadcn-vue init, used inside every generated component
    "class-variance-authority": "^0.7.1",  // shadcn plumbing: defines component variants (same as React side)
    "clsx": "^2.1.1",                      // shadcn plumbing: builds class strings from conditionals
    "tailwind-merge": "^3.4.1",            // shadcn plumbing: deduplicates conflicting tailwind classes
    "lucide-vue-next": "^0.564.0",         // shadcn plumbing: icon set (Vue version of lucide-react)
    "@vueuse/core": "^14.2.1"              // shadcn plumbing: Vue composition utilities (reactiveOmit, etc. used in components)
  },
  "devDependencies": {
    // STYLING — tailwind v4 via Vite plugin (Nuxt path — cleaner than PostCSS)
    "tailwindcss": "^4.1.18",             // styling: the tailwind engine
    "@tailwindcss/vite": "^4.1.18",       // styling: Vite plugin that wires tailwind into Nuxt build
    "tw-animate-css": "^1.4.0"            // styling: animation utilities for tailwind v4 (added by shadcn-vue init)

    // NOTE: no typescript/eslint/types here — Nuxt bundles these internally
    // NOTE: no shadcn-vue CLI in devDependencies — it runs via pnpm dlx, not installed locally
  }
}
```

### Component patterns

Button, switch, and card are three of the ~50+ components in shadcn's registry. We picked them because they cover three different component patterns. **Button** is a styled interactive primitive — it wraps a Reka UI `Primitive` element (or Radix `Slot` on the React side) and adds variant props (default, secondary, outline, destructive, ghost, link) and size props through CVA. **Switch** is an accessible stateful control — it wraps Reka UI's `SwitchRoot` and `SwitchThumb` (or their Radix equivalents), which provide keyboard support, aria attributes, and focus management, styled as the sliding pill toggle familiar from mobile UIs. **Card** is purely structural — it's actually seven sub-components (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction) that are just styled `<div>`s and headings with no headless-UI dependency at all. Together, the three demonstrate that shadcn components range from headless-primitive wrappers to plain layout containers, and the demo page proves all three patterns work end to end.

### Framework

Next.js has three packages: `next` itself, `react`, and `react-dom`. React is split into two because the core runtime (components, hooks, reconciler) is separate from the DOM renderer — this is the same split that lets React Native share the core but swap in a different renderer. In practice you always install both together for web apps. On the Nuxt side it's also three: `nuxt`, `vue`, and `vue-router`. Vue doesn't split its runtime from its renderer the way React does, but routing is a separate package rather than built into the framework. Nuxt bundles a lot more internally than Next.js does — TypeScript, ESLint, and Vite are all built in, which is why the Nuxt devDependencies list is so much shorter.

### Shadcn plumbing

These are the utility libraries that shadcn's generated components use internally. Every Button, Switch, Card, and Dialog that shadcn produces imports from these. They're not things you interact with directly in application code — they're the glue inside the component files.

Three packages are identical in both stacks — same library, same version, framework-agnostic:

- **class-variance-authority** (CVA) — defines component variants as typed maps. This is how a Button knows that `variant="destructive"` means one set of classes and `size="sm"` means another. CVA takes a base class string plus a variants object and returns a function that resolves the right classes for any combination of props. It has nothing to do with React or Vue — it's pure CSS class logic.

- **clsx** — a tiny utility that builds class strings from conditionals. It lets you write `clsx("base", isActive && "active", disabled && "opacity-50")` instead of manual string concatenation. Again, framework-agnostic — it just takes values and returns a string.

- **tailwind-merge** — deduplicates conflicting Tailwind classes. If a component has `px-2` in its base styles but you pass `px-4` as a className override, tailwind-merge knows these conflict and keeps only `px-4`. Without it, both classes would apply and the result would be unpredictable (whichever appears last in the CSS file wins, which depends on Tailwind's internal ordering). These three are wrapped together in the `cn()` helper that shadcn generates in `lib/utils.ts`: `cn()` calls `clsx()` to merge the conditionals, then `twMerge()` to deduplicate the result.

The icon libraries are framework-specific variants of the same project:

- **lucide-react** (Next.js) and **lucide-vue-next** (Nuxt) — both from the Lucide project (a fork of Feather Icons). Same icon set, same visual designs, just packaged as React components on one side and Vue components on the other. shadcn's generated components use these for things like chevrons in dropdowns, X buttons in dialogs, check marks in checkboxes, and the Sun/Moon icons we used in our demo.

One package is Nuxt-only:

- **@vueuse/core** — a collection of Vue composition utilities. shadcn-vue's generated components use specific functions from it like `reactiveOmit` (to forward props while excluding certain keys — e.g. the Switch component uses it to separate the `class` prop from the rest before forwarding). Reka UI itself provides `useForwardPropsEmits` for proxying props and events through wrapper components. React doesn't need an equivalent of either because JSX spread (`{...props}`) and destructuring handle these patterns natively. Vue's template syntax is more structured, so it needs helper utilities to achieve the same prop-forwarding patterns.

### Dev dependencies

This is where the two stacks diverge most sharply — not in what they can do, but in how much they ask you to manage yourself. Next.js has 11 devDependencies; Nuxt has 3. The gap isn't because Nuxt does less. It's because Nuxt bundles more internally.

**Styling** is the one area of genuine overlap. Both stacks have `tailwindcss` and `tw-animate-css` (a CSS-only animation utility that shadcn's components reference for transitions and keyframes). The difference is the integration plugin: Next.js uses `@tailwindcss/postcss` because Next.js runs Tailwind through its PostCSS pipeline, while Nuxt uses `@tailwindcss/vite` because Nuxt's build is Vite-native and Tailwind v4 has a first-class Vite plugin. The end result is identical — your Tailwind classes compile to the same CSS — but the wiring is different. PostCSS integration means Tailwind runs as one step in a chain of CSS transforms; Vite plugin integration means Tailwind hooks directly into Vite's module graph and gets features like HMR for free. The Vite path is newer and slightly faster in dev, but both are fully supported by the Tailwind team.

**TypeScript** accounts for four of Next.js's devDependencies that Nuxt doesn't need at all: `typescript` itself, `@types/node`, `@types/react`, and `@types/react-dom`. Next.js requires you to install and manage TypeScript as an explicit dependency — it detects a `tsconfig.json` and uses whatever TypeScript version you've installed. This means you control the TypeScript version, but you're also responsible for keeping it and the type packages updated. Nuxt takes a different approach: it ships TypeScript support internally via `nuxi typecheck` and auto-generates a `.nuxt/tsconfig.json` that extends your project config. Vue's type system is also different — Vue components are typed through `defineProps<T>()` and `.vue` file SFC compilation rather than separate `@types/` packages, so there's simply nothing to install.

**Linting** accounts for two more: `eslint` and `eslint-config-next`. The Next.js scaffold includes ESLint preconfigured with Next.js-specific rules (things like checking that `<Image>` is used instead of `<img>`, that metadata exports are valid, that server/client boundaries are respected). This is useful but it's your responsibility to maintain. The Nuxt minimal template doesn't scaffold any linting at all — if you want ESLint, you'd add the `@nuxt/eslint` module, which auto-configures flat config for Vue SFC linting, Nuxt-specific rules, and TypeScript-aware parsing. It's available but opt-in rather than default.

**CLI tooling** is one last difference. The Next.js side has `shadcn` (the shadcn CLI) installed as a local devDependency. This was done by `shadcn init` — it added itself to the project so that future `pnpm shadcn add` commands work without `dlx`. On the Nuxt side, we ran `pnpm dlx shadcn-vue@latest` every time — it downloads on-the-fly and doesn't persist in package.json. Neither approach is better; it's just a difference in how the two CLIs chose to set themselves up. You could install shadcn-vue locally too, or remove the shadcn dependency from Next.js and use dlx there — it's a convenience choice, not architectural.

The takeaway: Nuxt's 3 devDependencies vs Next.js's 11 isn't a feature gap. Both stacks have TypeScript, linting, Tailwind, and a component CLI. The difference is that Nuxt absorbs most of this into its framework module system, while Next.js keeps each tool as an explicit, user-managed dependency. The Nuxt approach means less to install and update; the Next.js approach means more visibility and control over each tool's version. This is the same philosophical split that shows up everywhere in the two frameworks — Nuxt is more opinionated and batteries-included, Next.js gives you more pieces to assemble yourself.

## Background

### Modern React Frontend Stack

* **Next.js** (App Router) — the framework. Handles routing, server rendering, and the React Server Components architecture where components are server-only by default and only ship JavaScript to the client when explicitly marked with `"use client"`.

* **Tailwind CSS v4** — the styling system. Utility-first CSS classes applied directly in markup. No component logic, just a way to style things. CSS-first configuration, Rust-powered build engine.

* **Radix UI** — the headless component library. Provides accessible, unstyled interactive primitives (dialogs, dropdowns, tooltips, etc.) that handle keyboard navigation, focus management, and ARIA compliance. You don't typically interact with it directly.

* **shadcn/ui** — the design layer. Pre-styled components built on Radix + Tailwind that get copied into your project as source code you own. Gives you a clean, modern, consistent look out of the box.

* **Branding and theming** — shadcn/ui's visual identity is driven by CSS custom properties (`--primary`, `--secondary`, `--accent`, `--radius`, etc.) defined in your global CSS. Applying a brand means swapping these values to your own colors, adjusting corner radius and typography, and optionally editing individual component files for more distinctive touches like custom hover effects or shadow treatments. Because the components are source code you own rather than a packaged dependency, there's no abstraction barrier — you can modify anything from global tokens down to individual component markup.

Tailwind handles all visual styling. Radix handles interactive behavior and accessibility. shadcn/ui composes the two into ready-made components. Next.js orchestrates everything with server/client rendering. You customize the look through CSS variables for global consistency and direct component edits for brand-specific details.

### Modern Vue/Nuxt Frontend Stack

* **Nuxt 4** — the framework. Handles routing, universal server rendering (classic model: server renders first page, client hydrates, then SPA navigation). Deploys serverless via Nitro to Cloudflare Workers, Vercel, Netlify, etc. No React Server Components equivalent — Vue's approach to the bundle size problem will come through Vapor Mode (compilation-based, not yet stable) rather than per-component server/client splitting.

* **Tailwind CSS v4** — identical. Same styling system, same utility classes, same CSS-first config. Works via Vite plugin, which is Nuxt's native build tool, so the integration is actually slightly cleaner than Next.js (which uses the PostCSS plugin path).

* **Reka UI** — the headless component library. This is the Vue equivalent of Radix. It was originally called Radix Vue (a community port), then rebranded to Reka UI for its v2 release. Same concept: accessible, unstyled primitives for dialogs, dropdowns, tooltips, etc. Reka UI is inspired by the principles and goals of Radix UI, sharing a commitment to accessibility, customization, and developer-friendly design.

* **shadcn-vue** — the design layer. Community port of shadcn/ui for Vue, built on Reka UI + Tailwind. Same copy-into-your-project model, same CSS variable theming, same visual aesthetic. As of the latest version, the `shadcn-vue@latest` command installs Reka UI by default. There's also a dedicated `shadcn-nuxt` module that handles auto-imports.

* **Branding and theming** — same approach as the React stack. CSS custom properties (`--primary`, `--radius`, etc.) for global theming, direct component file edits for brand-specific touches.

### Key differences between the two stacks

The rendering model is the big one. Nuxt 4 uses classic universal rendering — full hydration of the entire page on the client. Every component ships its JavaScript. You don't get RSC's selective hydration or the "server components never ship JS" benefit. For many consumer apps this is perfectly fine, but for very content-heavy pages the client bundle will be larger.

The ecosystem maturity is the second difference. shadcn-vue and Reka UI are community-driven ports, not first-party. They're well-maintained and Evan You himself has endorsed them, but they trail the React originals in component count, documentation depth, and ecosystem momentum. You'll occasionally hit a component that exists in shadcn/ui but not yet in shadcn-vue.

The deployment story is arguably better with Nuxt — Nitro gives you serverless output for Cloudflare Workers, AWS Lambda, etc. out of the box. Next.js *can* deploy serverless but is most tightly optimized for Vercel.

So the stack is structurally the same pattern, just with Vue equivalents at each layer, a simpler rendering model, and a serverless-first deployment story.

### Headless UI ecosystem

**Packages discussed in this section:**

- Radix UI (React, headless primitives, ~2.5M/wk — or 66M/wk for @radix-ui/react-slot)
    https://www.radix-ui.com/
    https://github.com/radix-ui/primitives
    https://www.npmjs.com/package/radix-ui
- Reka UI (Vue, headless primitives — Vue equivalent of Radix, ~650K/wk)
    https://reka-ui.com/
    https://github.com/unovue/reka-ui
    https://www.npmjs.com/package/reka-ui
- Base UI (React, headless primitives — Radix successor by original authors, ~890K/wk)
    https://base-ui.com/
    https://github.com/mui/base-ui
    https://www.npmjs.com/package/@base-ui/react
- Ark UI (React/Vue/Solid, headless primitives via Zag.js state machines, ~460K/wk)
    https://ark-ui.com/
    https://github.com/chakra-ui/ark
    https://www.npmjs.com/package/@ark-ui/react
- shadcn/ui (React, styled component layer on Radix + Tailwind, ~1.2M/wk)
    https://ui.shadcn.com/
    https://github.com/shadcn-ui/ui
    https://www.npmjs.com/package/shadcn
- shadcn-vue (Vue, styled component layer on Reka + Tailwind, ~47K/wk)
    https://www.shadcn-vue.com/
    https://github.com/unovue/shadcn-vue
    https://www.npmjs.com/package/shadcn-vue
- Nuxt UI (Vue/Nuxt, official component library on Reka + Tailwind, ~214K/wk)
    https://ui.nuxt.com/
    https://github.com/nuxt/ui
    https://www.npmjs.com/package/@nuxt/ui

Next.js gets `radix-ui`, Nuxt gets `reka-ui`. These solve the same problem: building interactive UI controls (dialogs, dropdowns, switches, tooltips) that are accessible out of the box — keyboard navigation, focus trapping, ARIA attributes, screen reader announcements — without imposing any visual design. They're "headless" because they handle behavior and accessibility but have zero styling. You never interact with these directly in application code; shadcn's generated components wrap them and add styling.

**Radix UI** was created around 2018 by the team at Modulz, a startup founded by Colm Tuite and Stephen Haney. In June 2022, WorkOS (an enterprise SSO/auth API company) acquired Modulz as part of its $80M Series B. The Radix team joined WorkOS, and the library continued under WorkOS stewardship. It has ~18.5k GitHub stars and the most-used package (`@radix-ui/react-slot`) sees ~18M weekly npm downloads — massive adoption driven largely by shadcn/ui depending on it.

However, Radix has a complicated recent history. After the acquisition, many of the original maintainers left WorkOS. Maintenance slowed significantly through 2023-2024, with issues and PRs piling up. Colm Tuite, the co-creator, publicly called Radix "a liability" and "the last option I'd consider for any serious project." The original engineers who left went on to create **Base UI** (under the MUI organization), which reached v1.0 stable in December 2025 — effectively a spiritual successor to Radix by the same people. WorkOS has attempted reinvestment (weekly livestreams, triage efforts in mid-2025), but whether that's sustained remains to be seen.

Notably, shadcn himself (who joined Vercel in 2023 as a Design Engineer — he is *not* a WorkOS employee) responded measured: Radix is "mature, well-designed, battle-tested and used in millions of production apps" and "code doesn't stop working because maintainers move on." As of January 2026, shadcn/ui officially supports **both Radix and Base UI** as backend primitive libraries, giving projects an escape hatch if Radix maintenance doesn't improve.

**Reka UI** has a different story. It was created by Zernonia, a frontend developer from Malaysia, in 2023 as "Radix Vue" — a Vue port of Radix's primitives. It rebranded to Reka UI ("reka" means "design" in Malay) with its v2 release in February 2025, reflecting that it had evolved beyond a straight port into its own project with Vue-idiomatic patterns and components Radix doesn't have. It has ~6k GitHub stars and is at v2.8.0 with frequent releases. Evan You (Vue's creator) has endorsed it. Crucially, it's the primitive layer underneath **Nuxt UI** (the official Nuxt component library), which ensures ongoing demand and relevance.

Reka UI has no corporate backing — no WorkOS equivalent behind it. That's both a risk and a feature: there's a real bus-factor concern around Zernonia as the primary maintainer (190+ contributors, but core direction flows through a small team), but there's also no risk of a corporate acquisition disrupting the project the way it disrupted Radix. The two projects are completely independent — there's no formal sync or tracking of releases between them.

### What should a modern Nuxt site use?

For Nuxt specifically, the realistic options for a component/UI layer are:

**Nuxt UI (v3)** is the "official" path. Built by NuxtLabs (the Nuxt team), it sits on top of Reka UI + Tailwind and is deeply integrated with the Nuxt ecosystem. It's essentially what shadcn/ui is to Next.js, but more first-party. Higher-level and more opinionated than shadcn-vue — it's a proper component library rather than a "copy source into your project" approach.

**shadcn-vue** is the shadcn pattern (you own the source code) ported to Vue. Community-maintained, it trails the React original in component count. Also sits on Reka UI underneath.

**Ark UI** is the interesting alternative, from the Chakra UI team. It uses **Zag.js** — framework-agnostic state machines — instead of Reka UI. It has a Vue adapter. Rather than porting Radix's approach per-framework, Zag encodes component behavior in framework-agnostic state machines and then thin adapters connect to React, Vue, or Solid. This is the only option that avoids a Reka UI dependency entirely.

**What doesn't exist:** a Vue equivalent of Base UI. Base UI is React-only. So the Radix-to-Base-UI escape hatch that shadcn/ui has on the React side simply doesn't apply in the Vue world.

Both Nuxt UI and shadcn-vue bet on Reka UI, which is healthy right now but single-maintainer. The risk picture is actually *simpler* on the Nuxt side than the React side — there's no acquisition drama, no competing successors, Reka UI is actively maintained and has Nuxt UI as a major downstream consumer ensuring it stays relevant. The React side has more options but also more fragmentation (Radix vs Base UI vs React Aria vs Ariakit).

For a modern Nuxt project: Nuxt UI if you want the blessed, best-integrated path and don't mind its opinions; shadcn-vue if you want the "own your source" pattern and are comfortable being one step behind the React ecosystem.

### shadcn-vue vs Nuxt UI: two paths for a modern Nuxt stack

The stack we scaffolded in this experiment — Nuxt + Tailwind + shadcn-vue — mirrors the React side as closely as possible. You run `shadcn-vue add button`, a `.vue` file lands in your `components/ui/` directory, and it's yours. You can read every line, modify anything, and there's no version to upgrade — the component is just source code in your repo. This is the shadcn philosophy: your project doesn't *depend on* shadcn-vue at runtime, it just used the CLI once to generate files. The tradeoff is that you're responsible for those files. If shadcn-vue ships an improved Button next month, you don't get it automatically — you'd re-run the add command and diff the result, or just keep what you have.

Nuxt UI takes a different approach. It's a proper npm dependency — you install `@nuxt/ui`, register it as a Nuxt module, and use components like `<UButton>` and `<UCard>` directly. You don't own the source; you configure behavior through props and theming. It's higher-level: Nuxt UI includes things like app layouts, navigation menus, command palettes, and form validation out of the box. It's also deeper integrated with Nuxt — auto-imports work seamlessly, the module hooks into Nuxt's build system, and the Nuxt DevTools know about it. When the Nuxt team ships a new version, you upgrade the package and get improvements (and potentially breaking changes).

Under the hood, they share the same foundation. Both use Reka UI for headless primitives and Tailwind for styling. Both use the same CSS variable theming system. A `<Button>` from shadcn-vue and a `<UButton>` from Nuxt UI are doing fundamentally the same thing — wrapping a Reka UI primitive, applying Tailwind classes through CVA variants, and respecting your theme tokens. The difference is ownership and abstraction level.

The practical choice depends on what kind of project you're building. shadcn-vue makes sense when you want maximum control over your component code — when you know you'll be customizing components heavily, when you want to understand every line of your UI layer, or when you're building something with a distinctive visual identity that doesn't fit neatly into a configurable theme system. It also makes sense if you're trying to keep your dependency on any single project minimal, since the generated files have no runtime dependency on shadcn-vue itself.

Nuxt UI makes sense when you want to move fast and stay on a maintained, well-integrated path — when you'd rather configure a `<UButton variant="soft" color="primary">` through props than edit the button's source file directly. It's the better choice for teams that want a consistent, batteries-included component library where someone else handles accessibility updates, bug fixes, and new component additions. It's also the better choice if you're already invested in the Nuxt ecosystem (Nuxt Content, Nuxt DevTools, etc.) since it's built to work with all of it.

For our purposes — evaluating the scaffolding steps and understanding the layers — shadcn-vue was the right choice. It made the stack legible: you can open every component file and see exactly how Reka UI, CVA, and Tailwind compose together. Nuxt UI would have hidden all of that behind a module registration and prop-driven API. But for a production Nuxt project where you want the most maintained, least-friction path, Nuxt UI (at 214K downloads/week vs shadcn-vue's 47K) is the stronger bet.
