//./stores/flexStore.js

export const useFlexStore = defineStore('flex_store', () => {

//not allowed to use await here, either, apparently
/*
ttd april
so here we are in a store which can run on the server, or the client
if it runs on the server, $fetch is actually a function call
there's already a request, the very first GET, and our middleware ran before we got here
hit.js below will run as the result of our fetch, and it will have the browser tag
so you think you can imagine these stores don't need the browser tag, even when they're running on the server, and could get the browser tag
*/
const loaded = ref(false)
const hits = ref(0)
const duration = ref(-1)
const sticker = ref('')

async function getHits() { if (loaded.value) return; loaded.value = true
	if (!hits.value) await _fetchHit('Get.')
}
async function incrementHits() {
	await _fetchHit('Increment.')
}

async function _fetchHit(action) {
	let task = Task({name: 'hit store fetch'})
	try {
		task.response = await fetchWorker('/api/hit', {body: {action}})
	} catch (e) { task.error = e }
	task.finish()
	if (!task.success) throw task//following draft pattern from PostButton, but here, why not just not have the try catch?

	hits.value = task.response.hits
	duration.value = task.duration
	sticker.value = task.sticker
}

return {
	loaded, hits,//return to keep in sync
	duration, sticker,
	getHits, incrementHits,//return for components to use
}

})
