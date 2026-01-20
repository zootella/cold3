//./stores/renderStore.js - data about the user whose profile/post page is being rendered
//separate from credentialStore which is about the viewer (who's browsing)
//follows the same pattern: loads during server render, lookup table prevents re-fetch for same user

export const useRenderStore = defineStore('renderStore', () => {

//lookup table: userTag → user data
//keyed by userTag so data persists even if user changes their name
const users = ref({})

//index: f0 → userTag for fast lookup from normalized route segment
const f0ToUserTag = ref({})

//currently rendered user (set by load, used by pages)
const current = ref(null)

async function load(raw1) {
	//normalize to f0 for cache lookup
	//note: this is a simplified normalization; the real f0 comes from the API
	const f0Guess = raw1.toLowerCase()

	//check cache: do we already have data for this user?
	const cachedUserTag = f0ToUserTag.value[f0Guess]
	if (cachedUserTag && users.value[cachedUserTag]) {
		current.value = users.value[cachedUserTag]
		return current.value
	}

	//fetch from API
	let task = await fetchWorker('/api/render', {body: {action: 'LookupName.', raw1}})

	//handle not found
	if (!task.success || !task.lookup) {
		current.value = null
		return null
	}

	//cache the result
	const lookup = task.lookup
	f0ToUserTag.value[lookup.f0] = lookup.userTag
	users.value[lookup.userTag] = lookup

	//set as current
	current.value = lookup
	return lookup
}

return {
	users,
	current,
	load,
}

})
