
import {
} from 'icarus'

/*
"flex" store: a store that may or may not be needed during the server render
summary of patterns found, ttd february

[I] the problem: a component (HitComponent) needs data from the server. if the first GET is to a page containing it,
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
with smoke testing. revisit if a cleaner community-endorsed pattern surfaces

[II] toward topic stores: right now our stores are organized by lifecycle role (mainStore = always SSR,
flexStore = maybe SSR, pageStore = client only). once the pattern is proven, stores should be organized by
topic instead (posts, credentials, etc.). a single topic store can mix methods in three categories:

1. flex-loaded: might be needed during SSR, might not. uses loaded flag + if (import.meta.server) await p.
   the initial batch of posts, a user profile — in the HTML if the route calls for it, non-blocking if not
2. client-only actions: plain await. load-more-on-scroll, form submission, user settings. only happen in
   response to user interaction, never during SSR. no guards needed
3. always-SSR: plain await, called from app.vue or a layout always in the render tree. loaded flag prevents
   re-fetch on hydration. this is the mainStore pattern today

the loaded flag and import.meta.server check can be per-method, not per-store. the store is organized around
its topic, and each method declares its own relationship to the rendering lifecycle through which pattern it uses

[III] deduplication — three tiers, from simplest to most capable

the loaded flag (used here, mainStore, credentialStore) means "never run again." multiple components can read
the same store ref, so they don't need a return value from the function — they subscribe to the ref. when
HitComponent appears twice on a page, both bind to flexStore.hits. the loaded flag prevents a second fetch:
loaded.value = true runs synchronously before any yield, so the second caller returns immediately regardless
of timing. the first fetch completes in the background, updates the ref, and Vue's reactivity delivers the
result to every bound component at once. on the server this is even simpler — SSR renders sequentially, so by
the time the second component renders, the first one's await has completed and the store already has data

sequentialShared (defined in icarus, not yet used in any store) solves a different problem: not "never run
again" but "don't overlap." it wraps an async function so concurrent callers share one in-flight promise, but
allows fresh calls after it resolves. you'd reach for it when a method should be callable more than once — a
refresh, a polling loop, a retry — but simultaneous calls should coalesce into one network request. any future
store method that re-fetches without a permanent loaded guard would need it

renderStore.getUser() goes a step further. it deduplicates per key — two components requesting the same user
share one fetch, while requests for different users proceed independently. this requires a map of promises, not
a single variable, so sequentialShared doesn't fit. on top of the transient promise map sits a permanent result
cache (mapNormalizedToUser): once a user is fetched, the object is stored and future calls return it without
touching the network. two tiers, one transient and one permanent, keyed by normalized name. for topic stores
with per-item fetches like postStore.getPost(id), this is the pattern to use
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
	let t = Now()
	let response = await Worker('/hit', action)

	hits.value = response.hits
	duration.value = Now() - t
	sticker.value = Sticker()//will say Local or CloudPageServer on server render, *PageClient after that
}

return {
	loaded, hits,//return to keep in sync
	duration, sticker,
	getHits, incrementHits,//return for components to use
}

})
