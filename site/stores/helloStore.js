
import {
getBrowserGraphics, sequentialShared,
indexRecords, mergeRecords,
} from 'icarus'

export const useHelloStore = defineStore('hello_store', () => {

const error1 = ref(null)
const duration1 = ref(-1)
const sticker1 = ref('')//ttd march probably get rid of these stickers, but keep the durations

const pageDuration = ref(-1)//how long it took for the user from the click here to Vue says app component mounted
const serverDuration = ref(-1)//within that, how long the server took to get together starting data for the page

//user
const user = ref({})//hello1 fills with browserTag and userTag, if there is one; hello2 adds name information

//codes
const codes = ref([])//codes this browser could enter, empty array before check or if none
const setCodes = (a2) => { if (!a2) a2 = []; codes.value = a2 }//ttd april, had trouble replacing the reference to a new array in components, even though that should work; doing that in this store method works fine. the lighter touch would be to clear and repopulate the array. and even that is short of comparing and updating the array only as needed; it's because you were using .vaule wrong, things might work simply now

//notifcations, entirely a system of the page, nothing from the database at all
const notifications = ref([])
const addNotification = (message) => {
	notifications.value.unshift({tag: Tag(), tick: Now(), message})
}
const removeNotification = (tag) => {
	notifications.value = notifications.value.filter(item => item.tag != tag)
}
/*
ttd april
now that you understand it's just helloStore.codes (no .value) when you're using this store outside of this file
you can probably get rid of setCodes, addNotification, and removeNotification
*/

const loaded = ref(false)
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
	task.finish({success: true})//ttd april, yeah, make this finish(task, {success: true}) so Task is a POJO you can really use everywhere, maybe call it done() or finished()
	//hello2 doesn't return anything, and the user can click the page while hello2 is happening
	//ttd april, ok, so even though hello2 doesn't matter, a good test of error handling is, the page still blows up if it throws or returns not success true
}

return {
	loaded, load, mounted,

	error1, duration1, sticker1,
	user,
	serverDuration, pageDuration,

	codes, setCodes,
	notifications, addNotification, removeNotification,
}

})
