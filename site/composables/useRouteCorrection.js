

/*
notes in render.txt about:
pages/[part1]/index.vue    ->  ProfilePage.vue
pages/[part1]/[part2].vue  ->  PostPage.vue

and how those four use:
stores/renderStore.js
server/api/render.js
composables/useRouteCorrection.js

find these files together by searching "render stack"
*/

//after rendering in a browser, without a 3XX redirect or messing up the Back button, correct the location from working to canonical forms, before the user bookmarks it or copies it to paste into a group chat or something
export function useRouteCorrection({user}) {//pass the user object we looked up from part1 to render a profile or post
	const route = useRoute()//Vue Router's reactive route object; wraps browser's location
	const router = useRouter()//Vue Router instance; wraps browser's History API

	if (//only do something if
		import.meta.client &&//we're running in a browser,
		user?.name?.f1 &&//we've found the user related to this route, and they have a canonical name,
		route.params.part1 != user.name.f1//and the first part of the route could be corrected to that canonical name
	) {
		let resolved = router.resolve({//use Nuxt's router.resolve() to properly reconstruct path with the corrected part1
			params: {...route.params, part1: user.name.f1}//this handles query strings, fragment, and avoids incorrectly replacing some other instance of the user name if it appears elsewhere in the route
		})
		router.replace(resolved.fullPath)//wraps history.replaceState() while keeping Vue Router's internal state with route.params in sync
	}
}
