//./stores/mainStore.js - always renders once and first on the server in universal rendering

import {
getBrowserGraphics,
indexRecords, mergeRecords,
} from 'icarus'

export const useMainStore = defineStore('main_store', () => {

//durations
const pageDuration = ref(-1)//how long it took for the user from the click here to Vue says app component mounted
const serverDuration = ref(-1)//within that, how long the server took to get together starting data for the page

//user
const user = ref({})

//codes
const codes = ref([])//codes this browser could enter, empty array before check or if none

//notifcations, entirely a system of the page, nothing from the database at all
const notifications = ref([])
const addNotification = (message) => { notifications.value.unshift({tag: Tag(), tick: Now(), message}) }
const removeNotification = (tag) => { notifications.value = notifications.value.filter(item => item.tag != tag) }

const loaded = ref(false)//prevent unnecessary reload on client after rendered and bridged from server
async function load() { if (loaded.value) return; loaded.value = true//runs on the server first, then a no-op on the client
	let r = await fetchWorker('/api/load')
	user.value = r.user
	codes.value = r.codes
	serverDuration.value = r.duration//save the duration measured by the server (well, in SSR this is the server, too, but still)
}
async function mounted() {//runs on the client, only, when app.vue is mounted
	pageDuration.value = Math.floor(performance.now())//whole milliseconds since the browser began navigating to the site
	log(`server render took ${serverDuration.value}ms ⏱️ ${pageDuration.value}ms navigation to mounted`)//log to browser console, even deployed
	await fetchWorker('/api/report', {body: {action: 'Hello.',
		sticker: Sticker().all,
		d1: pageDuration.value,//biggest first
		d2: serverDuration.value,//details within
		graphics: getBrowserGraphics(),
	}})
}

return {
	loaded, load, mounted,//return loaded: server call sets true, true value goes over Nuxt Bridge, client call to .load() is a no-op
	serverDuration, pageDuration,

	user,
	codes,
	notifications, addNotification, removeNotification,
}

})


