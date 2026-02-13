

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

import {
validateName,
} from 'icarus'

export const useRenderStore = defineStore('renderStore', () => {

//two lookup tables work together as a caching system:
const mapNormalizedToUser = ref({})//validated normalized (form 0) route part1 → user object
const mapNormalizedToPromise = {}//same thing → promise; in-flight requests for deduplication; importantly not reactive or serialized!
//ttd january, eventually you'll need to deal with stale information in the cache, or the cache growing to take too much memory in the browser tab, but for now, starting this out simple

//get user by raw route param - validates, checks cache, fetches if needed
//three states: cached (return immediately), in-flight (return existing promise), or fetch (start new request)
async function getUser({part1}) {//given route part1, get user information to render a profile page

	let v = validateName(part1)
	if (!v.ok) return null//not found because we can't even normalize part1 from the route to a user name!
	let n = v.f0//n is the validated, normalized form 0 of the name from part1 of the route

	if (mapNormalizedToUser.value[n]) {//if we already have profile information cached from a previous fetch about this user,
		return mapNormalizedToUser.value[n]//return that object of user information without needing to bother the api endpoint again
	}

	if (mapNormalizedToPromise[n]) {//we're getting information about this user profile right now,
		return mapNormalizedToPromise[n]//return the promise that's working on it
	}//both this caller and the earlier one will await the same result, which is the behavior we want!

	//if we make it here we need to get information about the part1 user name from the api endpoint
	async function f(part1) {//gave this function a name to make the promise flow easier to follow
		let task = await Worker('/render', 'Get.', {part1})
		if (!task.success || !task.user) return null//not found because we don't have a record of this user in the database
		let user = task.user//user information we looked up

		mapNormalizedToUser.value[user.name.f0] = user
		return user
	}
	let p = f(n)//start a new fetch, getting the promise and not awaiting it
	mapNormalizedToPromise[n] = p//cache the promise to not ask the same question twice,
	try {
		return await p//here, wait for the fetch to complete,
	} finally {
		delete mapNormalizedToPromise[n]//then clean up the promise
	}
}

async function getPost({userTag, postId}) {//ttd january, here's where render store will help getting information to render posts
	return null
}

return {
	mapNormalizedToUser,
	getUser,
	getPost,
}

})
