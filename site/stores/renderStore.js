

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

//three lookup tables work together as a caching system:
const mapNormalizedToTag = ref({})//validated normalized (form 0) route part1 → userTag
const mapNormalizedToPromise = {}//same thing → promise; in-flight requests for deduplication; importantly not reactive or serialized!
const mapTagToUser = ref({})//userTag → user object with that tag and validated name forms

//get user by raw route param - validates, checks cache, fetches if needed
//three states: cached (return immediately), in-flight (return existing promise), or fetch (start new request)
async function getUser({part1}) {//given route part1, get user information to render a profile page

	let v = validateName(part1)
	if (!v.ok) return null//not found because we can't even normalize part1 from the route to a user name!
	let n = v.f0//n is the validated, normalized form 0 of the name from part1 of the route

	let t = mapNormalizedToTag.value[n]//see if we already have profile information about the requested user name
	if (t) {
		let u = mapTagToUser.value[t]
		if (u) {
			return u
		}
	}

	if (mapNormalizedToPromise[n]) {//we're already getting information about this user profile
		return mapNormalizedToPromise[n]//return the promise that's working on it
	}//both this caller and the earlier one will await the same result, which is the behavior we want!

	let p = f(n)//otherwise we should ask the server about this user. start a new fetch,
	mapNormalizedToPromise[n] = p//cache the promise to not ask the same question twice,
	try {
		return await p//here, wait for the fetch to complete,
	} finally {
		delete mapNormalizedToPromise[n]//then clean up the promise
	}
}
async function f(n) {//naming this function f for the promise flow it's a part of
	let task = await fetchWorker('/api/render', {body: {action: 'Get.', part1: n}})
	if (!task.success || !task.user) return null//not found because we don't have a record of this user in the database
	let user = task.user

	mapNormalizedToTag.value[user.name.f0] = user.userTag
	mapTagToUser.value[user.userTag] = user
	return user
}

async function getPost(userTag, postId) {//ttd january, here's where render store will help getting information to render posts
	return null
}

return {
	mapTagToUser,
	getUser,
	getPost,
}

})
