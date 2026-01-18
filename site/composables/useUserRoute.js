
import {
fetchWorker,
} from 'icarus'

/*
useUserRoute: resolve user from route segment, correct URL case without HTTP redirect

WHAT THIS DOES:
- looks up user by route segment (e.g., "tokyo-girl") via API call to render endpoint
- validates against f0 (normalized) in credential_table
- returns userTag and userName (f2, display form)
- if URL case doesn't match canonical f1 (e.g., "Tokyo-Girl"), corrects it client-side

THE THREE NAME FORMS (from validateName in icarus/level1.js):
- f0: "tokyo-girl"    normalized, lowercase, for database uniqueness and case-insensitive lookup
- f1: "Tokyo-Girl"    canonical route, case-preserved, what URLs should display
- f2: "東京ガール"     display name, can include emoji, shown on page

ALTERNATIVE APPROACHES CONSIDERED:

1. HTTP 3xx redirect (navigateTo with redirectCode: 301)
   ❌ breaks Back button - redirect adds to browser history
   ❌ extra round trip - browser must make second request
   ❌ worse UX - user sees flash/reload

2. Nuxt global middleware (middleware/name.global.js)
   ❌ runs on EVERY route (/up, /feed, etc) - wasteful database lookups
   ❌ 150ms overhead concern on routes that don't need user lookup
   ❌ middleware navigateTo still causes redirect on server

3. Nuxt page middleware (definePageMeta middleware)
   ❌ same redirect problem on server side
   ⚠️ could work with client-only logic, but awkward

4. Direct database access via credentialNameGet() in composable
   ❌ requires decryptKeys() for database access during SSR
   ❌ decryption keys (ACCESS_K10_SECRET) not available in SSR page context
   ❌ even if SSR worked, client-side SPA navigation can't access database directly
   ❌ breaks the established pattern: all database access goes through door/API

WHY THIS APPROACH IS BEST:
✅ no HTTP redirect - page content correct from first GET (SSR works perfectly)
✅ router.replace() only runs client-side - uses history.replaceState under the hood
✅ Back button works - replaceState doesn't add history entry
✅ only runs for [part1] routes - no overhead on unrelated pages
✅ case-insensitive links always work - lookup is by f0, correction to f1 is cosmetic
✅ composable centralizes logic - pages stay clean, behavior documented here
✅ follows established door pattern - API handles key decryption and authentication

EDGE CASES THAT ARE FINE:
- JS disabled: URL stays wrong case, page works fine
- User copies URL before JS runs: link still works (case-insensitive lookup)
- SEO: correct content served, could add <link rel="canonical"> if worried

DATA FETCHING PATTERN - useAsyncData + fetchWorker:

Why useAsyncData (not useFetch, not raw $fetch, not direct database access):

useAsyncData is Nuxt's primitive for route-specific async data that needs SSR support.
It handles three scenarios this composable must support:

1. Direct navigation (new tab, refresh, typed URL):
   - SSR runs on server, useAsyncData executes the fetch function
   - Data is serialized into the HTML payload sent to browser
   - Client hydrates, useAsyncData reuses serialized data (NO re-fetch)

2. SPA navigation (click link from another page):
   - No SSR involved, composable runs only on client
   - useAsyncData executes the fetch function on client
   - Real HTTP request to API endpoint

3. Back/forward navigation:
   - Nuxt may use cached data from previous visit
   - useAsyncData handles this automatically

Why fetchWorker (not raw $fetch or useFetch's built-in fetch):

fetchWorker is our wrapper that handles the browser tag cookie system:

1. cookieMiddleware.js runs on every request, extracts browserTag from cookie
2. browserTag is stored in workerEvent.context.browserTag
3. During SSR, fetchWorker retrieves browserTag from useNuxtApp().ssrContext.event.context
4. fetchWorker reconstructs and forwards the cookie header for server-to-server calls
5. This allows the API to identify the browser even during SSR

This matters because:
- User's own profile page may render differently than viewing someone else's
- API can check if requesting browser is signed in as the profile owner
- Consistent with how all other API calls work in this codebase

The combination useAsyncData + fetchWorker gives us:
- Proper SSR/hydration data transfer (useAsyncData)
- Proper cookie/browserTag forwarding (fetchWorker)
- Proper key decryption via doorWorker in the API (fetchWorker → door pattern)
*/

//used by [part1]/index.vue and [part1]/[part2].vue
export async function useUserRoute(part1, fullPath) {
	/*
	useAsyncData params:
	- key: unique cache key for this data; normalized to lowercase so "First-LAST" and "first-last" share cache
	- handler: async function that fetches the data; we use fetchWorker to maintain cookie forwarding
	- returns: { data, error, pending, refresh } - we destructure data and error
	*/
	const { data, error } = await useAsyncData(
		`user-route-${part1.toLowerCase()}`,
		() => fetchWorker('/api/render', {body: {action: 'LookupName.', raw1: part1}})
	)

	//handle not found - API returns success:false with outcome, or error thrown
	if (error.value || !data.value?.success || !data.value?.lookup) {
		throw createError({statusCode: 404, statusMessage: 'Not Found'})
	}

	const lookup = data.value.lookup

	//case correction: if URL case doesn't match canonical f1, fix it client-side
	//no HTTP redirect, just cosmetic URL bar update via history.replaceState
	if (process.client && part1 !== lookup.f1) {
		const correctedPath = fullPath.replace(part1, lookup.f1)
		useRouter().replace(correctedPath)
	}

	return {
		userTag: lookup.userTag,
		userName: lookup.f2,//display name for page
		userRoute: lookup.f1,//canonical route
		isOwner: lookup.isOwner,//true if requesting browser is signed in as this user
	}
}
