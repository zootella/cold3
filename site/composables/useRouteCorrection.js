
/*
useRouteCorrection: correct URL case without HTTP redirect

WHAT THIS DOES:
- after renderStore loads user data, corrects URL case client-side if needed
- e.g., /first-LAST becomes /First-Last in the location bar
- uses router.replace() which calls history.replaceState under the hood

THE THREE NAME FORMS (from validateName in icarus/level1.js):
- f0: "tokyo-girl"    normalized, lowercase, for database uniqueness and case-insensitive lookup
- f1: "Tokyo-Girl"    canonical route, case-preserved, what URLs should display
- f2: "東京ガール"     display name, can include emoji, shown on page

WHY CLIENT-SIDE CORRECTION (not HTTP redirect):
✅ no HTTP redirect - page content correct from first GET (SSR works perfectly)
✅ router.replace() only runs client-side - uses history.replaceState under the hood
✅ Back button works - replaceState doesn't add history entry
✅ case-insensitive links always work - lookup is by f0, correction to f1 is cosmetic

ALTERNATIVE APPROACHES CONSIDERED:

1. HTTP 3xx redirect (navigateTo with redirectCode: 301)
   ❌ breaks Back button - redirect adds to browser history
   ❌ extra round trip - browser must make second request
   ❌ worse UX - user sees flash/reload

2. Nuxt global middleware (middleware/name.global.js)
   ❌ runs on EVERY route (/up, /feed, etc) - wasteful
   ❌ middleware navigateTo still causes redirect on server

3. Nuxt page middleware (definePageMeta middleware)
   ❌ same redirect problem on server side

EDGE CASES THAT ARE FINE:
- JS disabled: URL stays wrong case, page works fine
- User copies URL before JS runs: link still works (case-insensitive lookup)
- SEO: correct content served, could add <link rel="canonical"> if worried

USAGE:
Pages call this after loading renderStore:

    const renderStore = useRenderStore()
    await renderStore.load(route.params.part1)
    useRouteCorrection(route.params.part1, route.fullPath)
*/

//used by [part1]/index.vue and [part1]/[part2].vue after renderStore.load()
export function useRouteCorrection(routeParam, fullPath) {
	const renderStore = useRenderStore()

	//only correct on client, only if we have data, only if there's a mismatch
	if (import.meta.client && renderStore.current?.f1 && routeParam !== renderStore.current.f1) {
		const correctedPath = fullPath.replace(routeParam, renderStore.current.f1)
		//useRouter().replace() wraps history.replaceState() but also updates Vue Router's internal state
		//this keeps route.params and route.fullPath in sync with the corrected URL
		//using history.replaceState() directly would work for the cosmetic fix but leave Vue Router's
		//route object showing the old uncorrected values, which could cause confusion downstream
		useRouter().replace(correctedPath)
	}
}
