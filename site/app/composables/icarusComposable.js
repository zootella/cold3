
/*
In Vue 3, a "composable" is a function that uses Vue's Composition API (ref, computed, watch, lifecycle hooks) to encapsulate reusable reactive logic. Nuxt extends this with automatic imports: any function exported from a file in the /composables directory becomes globally available in .vue files without needing an import statement.

Typical composables return reactive state or wrap side effects (useFetch, useCookie, useRoute). But Nuxt's auto-import works for any named export—not just Vue-reactive functions.

We re-export plain helper functions from icarus here, and Nuxt's auto-import makes them available in all .vue components. These functions work whether the component runs during server-side rendering (SSR) or in the browser. This file is the bridge that brings icarus utilities into Nuxt's front-end world without manual imports everywhere.
*/

//  _                            _ _ _                          
// (_) ___ __ _ _ __ _   _ ___  | (_) |__  _ __ __ _ _ __ _   _ 
// | |/ __/ _` | '__| | | / __| | | | '_ \| '__/ _` | '__| | | |
// | | (_| (_| | |  | |_| \__ \ | | | |_) | | | (_| | |  | |_| |
// |_|\___\__,_|_|   \__,_|___/ |_|_|_.__/|_|  \__,_|_|   \__, |
//                                                        |___/ 

/*
./icarus/index.js                           - 1 Icarus library functions bundled together for export to both Nuxt and Lambda
./site/composables/icarusComposable.js      - 2 Nuxt composable to automatically import them into client-side Nuxt .vue files
./site/server/plugins/icarusServerPlugin.js - 3 Nitro plugin to pin them globally so they're also in server-side Nuxt .js files

^ you've wired together these three so common Icarus functions are automatically imported
in Lambda files you still have to import these from Icarus manually, but that's fine because the Lambda side is small
*/
import {
cookieOptions,
} from 'icarus'//first, we have to import things from icarus that we're going to use in this file
export {//exporting this full list of icarus functions and objects makes them available in all Vue components

//manual icarus import block for nuxt client
wrapper, Sticker, stickerParts, isLocal, isCloud,
Now, Time, inSeconds, Size, Limit, newline,
defined, toss, log, look,
noop, test, ok,

toBoolean, toTextOrBlank,
checkInt, minInt,
intToText, textToInt, commas,
checkText, hasText, checkTextSame, hasTextSame,
hasTextOrBlank, checkTextOrBlank,
makePlain, makeObject, makeText,
safefill, deindent,

Tag, hasTag, checkTag, checkTagOrBlank,
checkHash,

dog, logAudit, logAlert,
awaitDog, awaitLogAudit, awaitLogAlert,

Key, doorWorker, doorLambda,
Task, fetchWorker, fetchLambda, fetchProvider,
sealEnvelope, openEnvelope,
composeCookieName, composeCookieValue, parseCookieValue, cookieOptions,

} from 'icarus'

//                      _                                    _    _           
//   ___ _ ____   _____| | ___  _ __   ___    ___ ___   ___ | | _(_) ___  ___ 
//  / _ \ '_ \ \ / / _ \ |/ _ \| '_ \ / _ \  / __/ _ \ / _ \| |/ / |/ _ \/ __|
// |  __/ | | \ V /  __/ | (_) | |_) |  __/ | (_| (_) | (_) |   <| |  __/\__ \
//  \___|_| |_|\_/ \___|_|\___/| .__/ \___|  \___\___/ \___/|_|\_\_|\___||___/
//                             |_|                                            

/*
Beyond that, we define some functions here. Why are these here intead of in one of the lower levels of the Icarus library? Because they need to call other Nuxt composables, like useCookie. These are defined here, but won't work in Icarus, which is isomorphic and framework-agnostic. Cookie *options* can live in icarus (plain objects), but the useCookie() *call* must happen here.
*/

export function useOtpCookie() { return useCookie('temporary_envelope_otp', {...cookieOptions.envelope}) }
export function useTotpCookie() { return useCookie('temporary_envelope_totp', {...cookieOptions.envelope}) }//useCookie probably doesn't change or add to the options object we give it, but let's spread a fresh copy for each call, just in case

//  _     _     _                                    _                      _        _       
// | |__ (_)___| |_ ___  _ __ _   _   _ __ ___ _ __ | | __ _  ___ ___   ___| |_ __ _| |_ ___ 
// | '_ \| / __| __/ _ \| '__| | | | | '__/ _ \ '_ \| |/ _` |/ __/ _ \ / __| __/ _` | __/ _ \
// | | | | \__ \ || (_) | |  | |_| | | | |  __/ |_) | | (_| | (_|  __/ \__ \ || (_| | ||  __/
// |_| |_|_|___/\__\___/|_|   \__, | |_|  \___| .__/|_|\__,_|\___\___| |___/\__\__,_|\__\___|
//                            |___/           |_|                                            

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
