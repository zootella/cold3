
//this file is ./stores/store1.js

import {
Sticker, log, look, Now, Tag,
getBrowserTag,
} from 'icarus'
import {ref} from 'vue'
import {defineStore} from 'pinia'

export const useStore1 = defineStore('store1', () => {

// State
const hits = ref(0)//information from the server endpoint
const sticker = ref('')
const loading = ref(false)//true while we've got a fetch in flight
const error = ref(null)//error from the server, if the response was not ok
const duration = ref(0)//how long in milliseconds we waited for the response
const gotten = ref(false)//our own flag to not bother the api unnecessarily

// Actions
async function getHits() {
	if (!gotten.value) {
		await _fetchHit('Get.')
		if (!error.value) gotten.value = true
	}
}
async function incrementHits() {
	await _fetchHit('Increment.')
}

//Private helper functions
async function _fetchHit(action) {
	let t = Now()
	loading.value = true
	error.value = null//clear a previous error
	try {
		let data = await $fetch(
			'/api/hit',
			{
				method: 'POST',
				body: {
					action
				}
			}
		)
		hits.value = data.hits
		sticker.value = data.sticker
	} catch (e) {
		error.value = e
	}
	loading.value = false
	duration.value = Now() - t
	log(`store1 fetched api hit in ${duration.value}ms at ${Sticker().all}`)
}

return {
	hits, sticker,
	loading, error, duration,
	getHits, incrementHits,
	gotten,//necessary for the store to download correctly after server rendering
}

})
