# Tailwind CSS

## How It Works

**Tailwind v4** via `@tailwindcss/vite` — a Vite plugin, not a Nuxt module. Registered in `nuxt.config.js` alongside vidstack. No `tailwind.config.js` — all configuration lives in CSS.

**Global stylesheet** at `site/app/assets/css/style.css`:
1. `@font-face` declarations for two bundled woff2 fonts (Diatype Rounded, Lemon Wide)
2. `@import "tailwindcss"` — single import replaces the old three `@tailwind` directives
3. `@plugin "@tailwindcss/forms"` — normalizes form controls
4. `@theme` — overrides `--font-sans` (Diatype Rounded → Noto Sans → system) and `--font-mono` (Noto Sans Mono → system)
5. `@layer base` — body defaults, link colors, code styling
6. `@layer components` — `.my-button`, `.my-link`, and state classes (`.ghost`, `.ready`, `.doing`)

### Packages

| Package | Version | Role |
|---|---|---|
| tailwindcss | ^4.1.18 | The framework |
| @tailwindcss/vite | ^4.1.18 | Vite plugin (replaces the old `@nuxtjs/tailwindcss` Nuxt module) |
| @tailwindcss/forms | ^0.5.10 | Form control normalization plugin |

### Fonts

Three delivery methods, all independent of Tailwind:

| Font | Source | Used as |
|---|---|---|
| Diatype Rounded | Bundled woff2 in `public/fonts/` | Default body font (`--font-sans`) |
| Lemon Wide | Bundled woff2 in `public/fonts/` | Decorative (via plain CSS) |
| Noto Sans, Noto Sans Mono, Roboto | Google Fonts CDN link in nuxt.config.js | Sans fallback, code font (`--font-mono`), terms document |

System fallback stacks at the tail of every font-family list.

### Component Styling Patterns

Out of ~70 Vue files, three patterns:

1. **Utility classes in templates** (~57 files, dominant). Classes directly on elements, no `<style>` block. Preferred default.
2. **Scoped `@apply`** (9 files). Named class wrapping Tailwind utilities. Requires `@reference "tailwindcss"` at top of the `<style scoped>` block.
3. **Raw scoped CSS** (4 files). Fixed positioning, pixel values, `!important` overrides — things Tailwind can't express.

## Things That Bite

### @reference is required for scoped @apply

In v4, `@apply` in `<style scoped>` can't resolve Tailwind classes without `@reference "tailwindcss"` at the top. Anyone adding a new component with scoped `@apply` must include this line or the build fails with "Cannot apply unknown utility class."

9 components currently have it: CredentialCorner, CredentialPanel, SignUpOrSignInForm, PostPage, ProfilePage, TermsPage, TermsComponent, TermsDocument, TermsAnchors.

### Custom font utilities don't work in scoped @apply

`@reference "tailwindcss"` gives access to Tailwind's built-in utilities, but not to custom names defined in our `@theme`. The built-in `font-sans` and `font-mono` work because Tailwind knows those names — our `@theme` just overrides their values. But if we defined `--font-roboto` in `@theme`, `@apply font-roboto` would fail in any scoped style block.

**The rule:** For one-off font choices, use plain CSS (`font-family: "Roboto", sans-serif`) instead of a Tailwind utility. The browser knows the font because the Google Fonts `<link>` loaded it. No Tailwind involvement needed. This is what TermsDocument.vue and TermsComponent.vue do for Roboto.

Pointing `@reference` at our stylesheet instead of `"tailwindcss"` would fix this, but requires a subpath import (Vite aliases don't work inside `@reference`) and heavier compilation. Not worth it for two font references.

### Google Fonts CSS2 API requires sorted axis tuples

Found and fixed during migration: the Google Fonts URL had unsorted axis tuples (`ital,wght@0,400;1,400;0,700;1,700`), which the CSS2 API silently rejects with HTTP 400. All three linked fonts were failing to load on production — pages rendered in system fonts instead. The fix: sort numerically (`ital,wght@0,400;0,700;1,400;1,700`). Also removed the `&subset=latin,latin-ext` parameter (CSS v1 API feature; CSS2 handles subsetting automatically via `unicode-range`).

