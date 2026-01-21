
notesfile

# Bundle Size Analysis

## Current State

**Entry bundle (`_nuxt/entry.js`):** ~171KB brotli

**Why it's this size:**
- `app.vue` imports from `icarus` (`addTurnstileHeadScript`)
- `mainStore.js` imports from `icarus` (`getBrowserGraphics`, etc.)
- Icarus barrel file (`index.js`) re-exports from level0 → level1 → level2 → level3
- Level1.js has static imports that land in entry:
  - `zod` (email validation)
  - `libphonenumber-js` (phone validation)
  - `credit-card-type` (card validation)
  - `viem/getAddress` (wallet validation)

**Large chunks (500KB+ warning):**
- These are viem/wagmi/walletconnect chunks
- Already dynamically loaded via `wevmDynamicImport()` in level1.js
- Only load when user interacts with wallet features
- Warning is informational, not a problem

**Test code in entry bundle:**
- 22 `test()` function calls are included in entry.js
- This is intentional for `/up/up3` - a test comparison page that runs tests in multiple environments:
  - Server render (onServerPrefetch → runTestsSticker)
  - Client browser (onMounted → runTestsSticker)
  - Worker API (useFetch → /api/up/up3w)
  - Lambda API (useFetch → /api/up/up3l)
- Chain of inclusion:
  1. `app.vue` imports from icarus barrel
  2. Barrel re-exports level0-3
  3. Level files have top-level `test()` calls that execute on import
  4. `test()` pushes to `_tests` array, `runTestsSticker()` iterates it
  5. up3.vue imports `runTestsSticker` from entry.js
- If client-side testing isn't needed in production, could code-split test infrastructure

## Build Output Notes

**Vite version discrepancy:**
- Nuxt reports `Vite 6.4.1` but build uses `vite v7.1.12`
- Happens when Vite is installed directly at a different version than Nuxt's dependency
- Could cause subtle issues - worth aligning these versions

**PGlite assets (~14MB):**
- `pglite.*.data` - 4.9MB
- `pglite.*.wasm` - 8.8MB (3MB gzip)
- Full PostgreSQL in the browser for local testing with `yarn grid`
- Loaded dynamically via `pgliteDynamicImport()` - users never download this

**vidstack sourcemap warning:**
- `[plugin vidstack-post] Sourcemap is likely to be incorrect`
- Harmless - just means debugging video player code will be harder
- Upstream issue for vidstack team to fix

**Server includes embedded fonts:**
- `Inter-normal-400.ttf.mjs` - 553KB (252KB gzip)
- `Inter-normal-700.ttf.mjs` - 564KB (265KB gzip)
- For OG image generation (social share previews)
- Nuxt OG Image embeds fonts to render text to images on the edge

**Large WASM in server:**
- `index_bg-*.wasm` - 2.48MB (958KB gzip)
- Likely argon2 (password hashing) or another crypto library for Cloudflare Workers

**Total server deployment:**
- 6.63MB (2.35MB gzip)
- Most of this is fonts and WASM binaries

**Module counts:**
- Client: 5,273 modules transformed
- Server: 262 modules transformed
- 20x difference shows how much client code exists (web3 libraries, Vue components)
  vs relatively lean server API handlers

## Optimization Approaches

### Option A: Remove icarus from app root

**How:**
1. Remove icarus imports from `app.vue`
2. Inline or dynamically import `addTurnstileHeadScript`
3. Refactor stores used at app level similarly
4. Each page imports icarus as needed
5. Nuxt's route-based code splitting moves icarus to per-page chunks

**Tradeoffs:**
- High complexity (restructure app.vue, stores, composables)
- Enables true "instant landing page" pattern
- Would need prefetch hints for good UX on navigation

### Option B: Async validators with dynamic imports

**How:**
1. In `level1.js`, change static imports to dynamic:
   ```js
   // Before (static)
   import {z as zod} from 'zod'

   // After (dynamic)
   let _zod
   async function getZod() {
     if (!_zod) _zod = (await import('zod')).z
     return _zod
   }
   ```
2. Make validate functions async:
   ```js
   // Before
   export function validateEmail(text) { ... }

   // After
   export async function validateEmail(text) {
     const zod = await getZod()
     ...
   }
   ```
3. Update all callers to await validation

**Tradeoffs:**
- Medium complexity (refactor level1.js and callers)
- Slight delay on first validation call (imperceptible with caching)
- More surgical change, doesn't require app architecture changes

**Call chain analysis for Option B:**

The 5 static imports in level1.js (lines 24-28) flow through these functions:

```
zod
  └─ zodEmail() [private]
       └─ validateEmail()
            ├─ checkEmail() → net23/persephone/persephone.js:97
            └─ validateEmailOrPhone()
                 ├─ site/components/snippet1/CodeRequestComponent.vue:15
                 └─ site/server/api/code/send.js:15

libphonenumber-js
  └─ validatePhone()
       ├─ checkPhone() → net23/persephone/persephone.js:101
       └─ validateEmailOrPhone() → (same callers as above)

credit-card-type
  └─ validateCard()
       └─ checkCard() → (no external callers, only tests)

is-mobile
  └─ browserIsBesideAppStore()
       ├─ site/components/snippet1/QrDemo.vue:17
       ├─ site/components/snippet1/TotpDemo1.vue:55
       └─ site/components/snippet1/TotpDemo.vue:67

viem/getAddress
  └─ validateWallet()
       └─ checkWallet() → site/server/api/wallet.js:14,26
```

**Functions to make async in icarus/level1.js (10 functions):**
- `validateEmail()`, `checkEmail()`
- `validatePhone()`, `checkPhone()`
- `validateEmailOrPhone()`
- `validateCard()`, `checkCard()`
- `browserIsBesideAppStore()`
- `validateWallet()`, `checkWallet()`

**External call sites:**

Simple changes (containing function already async, just add `await`):
- `net23/persephone/persephone.js` - 2 lines (`checkEmail`, `checkPhone` in `sendMessage`)
- `site/server/api/code/send.js` - 1 line (`validateEmailOrPhone` in `doorHandleBelow`)
- `site/server/api/wallet.js` - 2 lines (`checkWallet` in `doorHandleBelow`)
- `site/components/snippet1/TotpDemo.vue` - 1 line (`browserIsBesideAppStore` in `onEnroll`)

Requires restructuring (sync context cannot become async):
- `site/components/snippet1/CodeRequestComponent.vue` - 1 call in `computed()`.
  Computed cannot be async. Refactor to `ref` + `watch` pattern (~10 lines).
- `site/components/snippet1/QrDemo.vue` - 1 call in template expression.
  Templates cannot await. Refactor to `ref` + `onMounted` (~5 lines).
- `site/components/snippet1/TotpDemo1.vue` - 1 call in template expression.
  Same issue. Refactor to `ref` + `onMounted` (~5 lines).

### Option C: Do nothing

**Rationale:**
- 171KB brotli is ~200ms on decent 3G
- Heavy web3 chunks are already dynamic
- Current architecture works

## Recommendations

For most cases, **Option C (do nothing)** is fine. The current bundle is reasonable.

If optimization is needed:
- **Option B** is the better investment - it's surgical and keeps the app structure intact
- **Option A** is higher effort and only worth it if you want a true "zero JS" landing page

## Files involved

- `/icarus/level1.js` - static imports of validation libraries (lines 23-28)
- `/icarus/index.js` - barrel file that re-exports everything
- `/site/app.vue` - root component, imports from icarus
- `/site/stores/mainStore.js` - used by app.vue, imports from icarus
- `/site/size/client.html` - treemap visualization (run `yarn size` in site)

## Build output files

For reference, build outputs captured in:
- `/build-site.txt`
- `/build-oauth.txt`
- `/build-net23.txt`
- `/local-site.txt`
- `/local-oauth.txt`
- `/local-net23.txt`
