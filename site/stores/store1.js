
//this file is ./stores/store1.js

import {
Sticker, log, look, Now, Tag, checkText, checkTag,
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
/*
ttd february important
ok, but if a whole bunch of components show up on the page all at once
and they all call into getHits at the same time
coded this way, there will be a flurry of overlapping and identical fetch calls
so you need to isolate this as follows:
- if there's a fetch in flight, another one doesn't begin
- and you need to do the fancy promise thing where after the first or going fetch finishes, any number of await-ers all return at once
*/

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

//information that doesn't come from an endpoint or the database!




/*
const _browserTag = ref('')
const _ipAddress = ref('')
function setBrowserTag(tag) {
	if (hasText(_browserTag.value)) toss('state')//use this only once, on the client
	checkTag(tag)
	_browserTag.value = tag
}
function setIpAddress(s) {
	if (hasText(_ipAddress.value)) toss('state')//use this only once, on the server
	checkText(s)
	_ipAddress.value = s
}
//remember, of course, that the loaded page on a tab on a phone can move to a different ip address, of course. so this is really more like starting or first delivery ip address. we also get ip address information with every POST

const browserTag = readonly(_browserTag)
const ipAddress = readonly(_ipAddress)


//^is there a way so that once set beyond blank, the store makes sure they cannot change again?
//if im returning them as a ref object, code that should only read them could accidentally change value, for instance
//what's the right way to make a store variable that's read-only, or can only be set by a specific function
*/

//trusted, from cloudflare
let _ipAddressOnLoad = ref('')//the ip address of the browser when it first contacted us and we sent the page; later POSTs might come from that same page on a device that has moved to a different ip address!
let _userAgentOnLoad = ref('')//how the browser identified itself on its first GET

//not trusted, whatever the browser told us
let _browserGraphics = ref('')
let _browserTag = ref('')


return {
	hits, sticker,
	loading, error, duration,
	getHits, incrementHits,
	gotten,//necessary for the store to download correctly after server rendering

	_ipAddressOnLoad, _userAgentOnLoad,
	_browserGraphics, _browserTag,//returning these so they make it on the bridge, but don't use them
}

})




/*
these are api endpoints, as well as methods on the store

/api/hi1
is a user signed in or not
should be able to do in a single ~150ms call to supabase
necessary very early, as the site will either render brochure-like or feed-like components!

right after that, in the background, call hi2 to do more introductory stuff that doesn't matter as much

/api/hi2
is a user signed in or not
what is the user's name
and the hash or part of their user tag, maybe hash then base16 like user00ff00ff00ff
([]^write a little helper function for that)
is the user super authenticated for an hour or less right now (maybe you'll show a dot)
and record this new hit to our server










*/






















