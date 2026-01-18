# User Profile Page Rendering - Implementation Summary

## What We're Building

User profile pages at dynamic routes like `/First-Last` and `/First-Last/some-post` that:
1. Look up users by route segment (case-insensitive)
2. Correct URL case without HTTP redirect (e.g., `/first-LAST` → `/First-Last`)
3. Display the user's name and profile information
4. Know if the viewer is the profile owner (for personalized rendering)

## The Three Name Forms

From `validateName` in `icarus/level1.js`, each user has three name representations:
- **f0**: `"tokyo-girl"` - normalized, lowercase, for database uniqueness and case-insensitive lookup
- **f1**: `"Tokyo-Girl"` - canonical route, case-preserved, what URLs should display
- **f2**: `"東京ガール"` - display name, can include emoji, shown on page

## The Case Correction Problem

When a user navigates to `/first-LAST` but the canonical form is `/First-Last`:
- We want the page to render correctly (lookup by f0 works)
- We want the URL bar to show `/First-Last` (cosmetic correction)
- We do NOT want an HTTP 3xx redirect (breaks Back button, extra round trip, flash/reload)

**Solution**: Use `router.replace()` on the client side, which calls `history.replaceState()` under the hood - corrects URL without adding history entry.

## Why We Can't Access Database Directly in Composables

Initial attempt was to call `credentialNameGet()` directly in the composable. This failed because:

1. **SSR page context lacks decryption keys**: `ACCESS_K10_SECRET` is available to API routes via `doorWorker` but not during page SSR
2. **Client-side can't access database**: Even if SSR worked, SPA navigation runs only on client which has no database access
3. **Breaks established pattern**: All database access in this codebase goes through door/API endpoints

## Why useAsyncData + fetchWorker

### The Nuxt Universal Rendering Challenge

A composable like `useUserRoute` runs in multiple contexts:

1. **Direct navigation (SSR)**: New tab, refresh, typed URL
   - Composable runs on SERVER during SSR
   - Then runs again on CLIENT during hydration

2. **SPA navigation**: Click link from another page
   - Composable runs ONLY on CLIENT

### Why useAsyncData

`useAsyncData` is Nuxt's primitive for route-specific async data with SSR support:

- **SSR**: Executes fetch function on server, serializes data into HTML payload
- **Hydration**: Reuses serialized data (NO re-fetch)
- **SPA navigation**: Executes fetch function on client
- **Back/forward**: May use cached data

This is different from the Pinia "loaded flag" pattern we use elsewhere. See "Key Insight: Why Not Pinia?" below for detailed explanation of why route-specific data (profile for `/Alice` vs `/Bob`) requires a different approach than global state (current user's auth).

### Why fetchWorker (not raw $fetch)

`fetchWorker` handles the browser tag cookie system:

1. `cookieMiddleware.js` runs on every request, extracts `browserTag` from cookie
2. `browserTag` stored in `workerEvent.context.browserTag`
3. During SSR, `fetchWorker` retrieves browserTag from `useNuxtApp().ssrContext.event.context`
4. `fetchWorker` reconstructs and forwards the cookie header for server-to-server calls
5. This allows the API to identify the browser even during SSR

This matters because the profile page may render differently when viewing your own profile vs someone else's.

## New Files Created

### `/site/server/api/render.js`

New API endpoint for page rendering data, separate from `credential.js` (which handles auth actions).

```javascript
export default defineEventHandler(async (workerEvent) => {
    return await doorWorker('POST', {actions: ['LookupName.'], workerEvent, doorHandleBelow})
})
```

- Uses `doorWorker` which calls `decryptKeys()` → database access works
- `doorWorker` extracts `browserHash` from cookies → passed to handler
- `LookupName.` action returns `{userTag, f0, f1, f2, isOwner}`

### `/site/composables/useUserRoute.js`

Composable used by `[part1]/index.vue` and `[part1]/[part2].vue`:

```javascript
export async function useUserRoute(part1, fullPath) {
    const { data, error } = await useAsyncData(
        `user-route-${part1.toLowerCase()}`,
        () => fetchWorker('/api/render', {body: {action: 'LookupName.', raw1: part1}})
    )

    if (error.value || !data.value?.success || !data.value?.lookup) {
        throw createError({statusCode: 404, statusMessage: 'Not Found'})
    }

    const lookup = data.value.lookup

    // Case correction on client only
    if (process.client && part1 !== lookup.f1) {
        const correctedPath = fullPath.replace(part1, lookup.f1)
        useRouter().replace(correctedPath)
    }

    return {
        userTag: lookup.userTag,
        userName: lookup.f2,
        userRoute: lookup.f1,
        isOwner: lookup.isOwner,
    }
}
```

## Modified Files

### `/site/pages/[part1]/index.vue`

User profile page, now uses composable:

```vue
<script setup>
const route = useRoute()
const {userTag, userName} = await useUserRoute(route.params.part1, route.fullPath)
</script>
<template>
<div>
<h1>{{ userName }}</h1>
<p>user profile page for {{ userTag }}</p>
</div>
</template>
```

### `/site/pages/[part1]/[part2].vue`

User post page, now uses composable:

```vue
<script setup> definePageMeta({layout: 'column-layout', note: 'on pages'})
const route = useRoute()
const {userTag, userName} = await useUserRoute(route.params.part1, route.fullPath)
const part2 = route.params.part2
</script>
<template>
<div>
<h1>{{ userName }}</h1>
<p>Post: <strong>{{ part2 }}</strong></p>
</div>
</template>
```

### `/site/server/api/credential.js`

Removed `LookupNamePublic.` action (moved to render.js as `LookupName.`).

## Request Flow Diagrams

### SSR Flow (Direct Navigation)

```
Browser GET /first-LAST
    ↓
cookieMiddleware extracts browserTag → stores in context
    ↓
Page SSR: useUserRoute() → useAsyncData() → fetchWorker()
    ↓
fetchWorker detects process.server
    → retrieves browserTag from useNuxtApp().ssrContext.event.context
    → forwards cookie header in POST to /api/render
    ↓
doorWorker in render.js
    → decryptKeys() → database keys available
    → extracts browserHash from cookie
    → calls handler with {browserHash, body, action}
    ↓
LookupName. handler
    → credentialNameGet({raw1}) → finds user
    → credentialBrowserGet({browserHash}) → checks if viewer is owner
    → returns {lookup: {userTag, f0, f1, f2, isOwner}}
    ↓
useAsyncData serializes response into HTML payload
    ↓
Browser receives HTML with data embedded
    ↓
Client hydration: useAsyncData reuses serialized data (NO re-fetch)
    ↓
process.client: router.replace() corrects URL if needed
```

### SPA Navigation Flow (Click Link)

```
User clicks link to /first-LAST
    ↓
Page client: useUserRoute() → useAsyncData() → fetchWorker()
    ↓
fetchWorker on client: real HTTP POST to /api/render
    (browser automatically sends cookies)
    ↓
Server: same doorWorker → decryptKeys → handler flow
    ↓
Response returned to client
    ↓
process.client: router.replace() corrects URL if needed
```

## Smoke Test Plan

With `yarn local` in the site workspace:

**Part 1 (user profile):**
- `/First-Last` → should work, show "First Last" display name
- `/first-last` → should work, URL corrects to `/First-Last`
- `/FIRST-LAST` → should work, URL corrects to `/First-Last`
- `/first-LAST` → should work, URL corrects to `/First-Last`
- `/nonexistent-user` → should 404

**Part 2 (user post):**
- `/First-Last/some-post` → should work
- `/first-LAST/some-post` → should work, URL corrects to `/First-Last/some-post`

**Back button test:**
- Navigate to `/first-last`, watch it correct to `/First-Last`
- Click Back → should go to previous page (not `/first-last`)

## Related Earlier Work

### Fake .env.keys File

The session started with fixing a fake `.env.keys` file for local development. Fixed:
- **Password salt**: Generated 16 random bytes as base62 for `password, salt, public`
- **Envelope secret**: Generated 32 random bytes as base62 with prefix for `envelope, secret`

After updating `.env.keys`, must run `yarn seal` to regenerate `wrapper.js` with new keys.

### Key Insight: Why Not Pinia? (Route-Specific vs Global State)

Earlier in this codebase, we eliminated `useFetch` calls in favor of Pinia stores with a "loaded flag" pattern. This raised the question: should we use a Pinia store here too?

**The Pinia "loaded flag" pattern works for GLOBAL state:**
- `credentialStore` - the currently signed-in user's auth state
- `mainStore` - site-wide configuration loaded once
- Data that is the SAME regardless of which route you're on
- Data that is about "me" (the current user/browser)

**User profile lookup is ROUTE-SPECIFIC state:**
- `/Alice` needs Alice's profile data
- `/Bob` needs Bob's profile data
- The data changes based on the ROUTE, not the current user
- Data that is about "them" (the user in the URL)

**Why the Pinia pattern doesn't fit:**

1. **No natural singleton**: `credentialStore.loaded` makes sense - there's one current user. But "user profile loaded" would need to track loaded state per-username, which is awkward.

2. **Cache invalidation complexity**: If Alice updates her profile, we'd need to invalidate just her cache entry. With route-specific data, Nuxt's built-in caching (keyed by route) handles this naturally.

3. **Different data lifecycle**: Global state persists across navigation. Route-specific data should refresh when you navigate to a different user's profile.

**useAsyncData is designed exactly for this:**
- Automatically keyed by route (via the key parameter we provide)
- SSR serialization built-in
- No re-fetch on hydration
- Fresh fetch on SPA navigation to different routes
- Nuxt manages the cache lifecycle

**The distinction in one sentence:** Pinia stores answer "what do I need to know about the current session?" while useAsyncData answers "what do I need to know about this specific page?"

## Files to Review

- `/site/composables/useUserRoute.js` - main composable with extensive comments
- `/site/server/api/render.js` - new API endpoint
- `/site/pages/[part1]/index.vue` - user profile page
- `/site/pages/[part1]/[part2].vue` - user post page
- `/site/server/api/credential.js` - verify LookupNamePublic removed
