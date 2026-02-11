
import {
} from 'icarus'

/*
"flex" store: a store that may or may not be needed during the server render

the problem:
a component (HitComponent) needs data from the server. if the first GET is to a page containing it,
the data should be in the server-rendered HTML (for crawlers, for the all-at-once first paint). if the
user arrives on a different page and later navigates to it, the data should be fetched on the client
without blocking the navigation — the page appears instantly with defaults and fills in when the fetch completes

what we tried (february 2026):
- useAsyncData: Nuxt docs explicitly warn against it for Pinia actions (repeated executions, nullish values)
- callOnce: handles SSR-to-client deduplication, but the loaded ref already does that via Pinia's state
  serialization across the bridge. callOnce was redundant. also, callOnce lives in the component, not the
  store, so every consuming component would need it. and callOnce doesn't solve client navigation blocking
- awaitOnServer helper: tried wrapping the pattern in a reusable async function, but the promise chaining
  made it impossible to both pass through return values and break the await chain on the client

what we landed on:
- loaded ref: Pinia serializes it across the SSR-to-client bridge. deduplicates across all three cases:
  server render (fetches), client hydration (skips), client navigation (fetches). multiple callers handled
- let p = _fetchHit(); if (import.meta.server) await p: on the server, blocks so SSR has the data.
  on the client, Vite tree-shakes the import.meta.server branch, the function returns without awaiting,
  the component's await resolves instantly, the page appears, and the fetch completes in the background

this is hand-rolled. it's suspect that such a fundamental universal rendering pattern isn't prominently
documented in Nuxt/Pinia guides. we may be missing an idiomatic solution. works mechanically; verifying
with smoke testing. revisit if a cleaner community-endorsed pattern surfaces, ttd feburary
*/

export const useFlexStore = defineStore('flexStore', () => {

const loaded = ref(false)
const hits = ref(0)
const duration = ref(-1)
const sticker = ref('')

async function getHits() { if (loaded.value) return; loaded.value = true//only go through here once, server and client combined
	let p = _fetchHit('Get.')//start getting the information
	if (import.meta.server) await p//if we're still on the server render, wait here to deliver a filled-in page
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
