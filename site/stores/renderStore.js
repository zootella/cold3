

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

//lookup table: userTag → user data
//keyed by userTag so data persists even if user changes their name
const users = ref({})

//index: f0 → userTag for fast lookup from normalized route segment
const f0ToUserTag = ref({})

//in-flight promises for request deduplication (not reactive, not serialized across bridge)
const pending = {}

//get user by raw route param - validates, checks cache, fetches if needed
//three states: cached (return immediately), in-flight (return existing promise), or fetch (start new request)
async function getUser(raw1) {
	const v = validateName(raw1)
	if (!v.ok) return null

	const f0 = v.f0

	//cached result - return immediately
	const cachedUserTag = f0ToUserTag.value[f0]
	if (cachedUserTag && users.value[cachedUserTag]) {
		return users.value[cachedUserTag]
	}

	//in-flight promise - return same promise (both callers await same result)
	if (pending[f0]) {
		return pending[f0]
	}

	//start fetch, cache promise for deduplication
	const promise = (async () => {
		const task = await fetchWorker('/api/render', {body: {action: 'LookupName.', raw1: f0}})
		if (!task.success || !task.lookup) return null

		const lookup = task.lookup
		f0ToUserTag.value[lookup.name.f0] = lookup.userTag
		users.value[lookup.userTag] = lookup
		return lookup
	})()

	pending[f0] = promise

	try {
		return await promise
	} finally {
		delete pending[f0]
	}
}

//stub for future: get post by identifier
async function getPost(userTag, postId) {
	//TODO: implement post fetching
	return null
}

return {
	users,
	getUser,
	getPost,
}

})
