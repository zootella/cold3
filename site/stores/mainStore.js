//./stores/mainStore.js
/*
mainStore - loads on server, updates on page as user clicks
flexStore - loads on server or page, depending on the GETed route, for demonstration in development
pageStore - starts empty on server and client at the start, updates on page
*/

import {
getBrowserGraphics,
indexRecords, mergeRecords,
} from 'icarus'

export const useMainStore = defineStore('main_store', () => {

const error1 = ref(null)
const duration1 = ref(-1)
const sticker1 = ref('')//ttd march probably get rid of these stickers, but keep the durations

const pageDuration = ref(-1)//how long it took for the user from the click here to Vue says app component mounted
const serverDuration = ref(-1)//within that, how long the server took to get together starting data for the page

//user
const user = ref({})//hello1 fills with browserTag and userTag, if there is one; hello2 adds name information

//codes
const codes = ref([])//codes this browser could enter, empty array before check or if none

//notifcations, entirely a system of the page, nothing from the database at all
const notifications = ref([])
const addNotification = (message) => {
	notifications.value.unshift({tag: Tag(), tick: Now(), message})
}
const removeNotification = (tag) => {
	notifications.value = notifications.value.filter(item => item.tag != tag)
}

const loaded = ref(false)//prevent unnecessary reload on client after rendered and bridged from server
async function load() { if (loaded.value) return; loaded.value = true//runs on the server first, then a no-op on the client
	try {
		let t = Now()
		error1.value = null//clear a previous error

		//a new tab's GET is causing this all to render on the server, so the fetch below will actually be a function call, and we must include the cookie we got, or have chosen to set, with the browser
		//ttd april, move that note into fetch worker
		let r = await fetchWorker('/api/hello1')
		sticker1.value = r.sticker
		user.value = r.user
		codes.value = r.codes
		serverDuration.value = r.duration//save the duration measured by the server (well, in SSR this is the server, too, but still)

		duration1.value = Now() - t
	} catch (e) { error1.value = e }
}
async function mounted() {//runs on the client, only, when app.vue is mounted
	pageDuration.value = Math.floor(performance.now())//whole milliseconds since the browser began navigating to the site
	log(`got page duration ${pageDuration.value} and server duration ${serverDuration.value}`)

	let task = Task({name: 'fetch report'})
	task.response = await fetchWorker('/api/report', {body: {action: 'Hello.',
		sticker: Sticker().all,
		d1: pageDuration.value,//biggest first
		d2: serverDuration.value,//details within
		graphics: getBrowserGraphics(),
		//ttd april, here's where you'll add the time information from the start of the browser's GET, and from how long the server told us it was working on load above, careful to pass that one through the pinia nuxt bridge!!
	}})
	task.finish({success: true})
	//mounted() doesn't return anything, and the user can click the page while mounted() is happening
	//ttd april, ok, so even though hello2 doesn't matter, a good test of error handling is, the page still blows up if it throws or returns not success true
}

return {
	loaded, load, mounted,//return loaded: server call sets true, true value goes over Nuxt Bridge, client call to .load() is a no-op
	loaded, load, mounted,

	error1, duration1, sticker1,
	user,
	serverDuration, pageDuration,

	codes, /*setCodes,*/
	notifications, addNotification, removeNotification,
}

})


