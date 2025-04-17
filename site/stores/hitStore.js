
import {defineStore} from 'pinia'

export const useHitStore = defineStore('hit_store', () => {

const hits = ref(0)
const duration = ref(-1)
const sticker = ref('')
//[]errorspot, margin

async function getHits() {
	if (!hits.value) await _fetchHit('Get.')
}
async function incrementHits() {
	await _fetchHit('Increment.')
}

async function _fetchHit(action) {
	//[]errorspot, server|client X local|cloud X function|margin, above
	log('hi from hitStore.js 🤎 running ' + Sticker().all)

	let task = Task({name: 'hit store fetch'})
	try {
		task.response = await $fetch('/api/hit', {method: 'POST', body: {action}})
	} catch (e) { task.error = e }
	task.finish()
	if (!task.success) throw task//following draft pattern from PostButton, but here, why not just not have the try catch?

	hits.value = task.response.hits
	duration.value = task.duration
	sticker.value = task.sticker
}

return {
	hits,//return to keep in sync
	duration, sticker,
	getHits, incrementHits,//return for components to use
}

})









/*
ttd april, removing gotten from here because, that can't possibly be right

const gotten = ref(false)//our own flag to not bother the api unnecessarily
//^ttd april, do you need this?!


	gotten,//necessary for the store to download correctly after server rendering

*/



//errorspot, hitStore is server rendered, and then goes across the bridge, using Pinia's support for hybrid rendering (helloStore does not do this) so you need to make an errorspot here, and see it hit both server and client!



















//unlike helloStore, hitStore is used only one place, HitComponent, and not in any plugins. this lets it demonstrates hybrid rendering: curl gets a page with the current hit count, nothing blinks, and the browser console shows there's  no second fetch at all!








