
import {defineStore} from 'pinia'

export const useHitStore = defineStore('hit_store', () => {

const hits = ref(0)
const duration = ref(-1)
const sticker = ref('')
//[x]errorspot

async function getHits() {
	if (!hits.value) await _fetchHit('Get.')
}
async function incrementHits() {
	await _fetchHit('Increment.')
}

async function _fetchHit(action) {
	log('hi from hitStore.js 🤎 running ' + Sticker().all)
	//[x]errorspot, client render, comes in through "Vue."; server render, comes in "Vue." and then "Nuxt."

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
