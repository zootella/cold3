//./stores/mainStore.js - always renders once and first on the server in universal rendering

import {
getBrowserGraphics,
indexRecords, mergeRecords,
} from 'icarus'

export const useMainStore = defineStore('main', () => {

//durations
const pageDuration = ref(-1)//how long it took for the user from the click here to Vue says app component mounted
const serverDuration = ref(-1)//within that, how long the server took to get together starting data for the page

//objects and arrays from the database
const user = ref({})//information about the user, if any, signed into this browser
const codes = ref([])//codes this browser could enter, empty array before check or if none

const loaded = ref(false)//prevent unnecessary reload on client after rendered and bridged from server
async function load() { if (loaded.value) return; loaded.value = true//runs on the server first, then a no-op on the client
	let r = await fetchWorker('/api/load')
	user.value = r.user
	codes.value = r.codes
	serverDuration.value = r.duration//save the duration measured by the server (well, in SSR this is the server, too, but still)
}
async function mounted() {//runs on the client, only, when app.vue is mounted
	pageDuration.value = Math.floor(performance.now())//whole milliseconds since the browser began navigating to the site
	console.log(
		'%cSecurity warning: DO NOT PASTE anything in here. Anyone telling you to is trying to steal your account!',
		'font-family: monospace; font-size: 20px; color: white; background: #ff4f00; padding: 12px; border-radius: 16px;'
	)
	log(`server render took ${serverDuration.value}ms ⏱️ ${pageDuration.value}ms navigation to mounted`)//log to browser console, even deployed
	await fetchWorker('/api/report', {body: {action: 'Hello.',
		sticker: Sticker(),
		d1: pageDuration.value,//biggest first
		d2: serverDuration.value,//details within
		graphics: getBrowserGraphics(),
	}})
}

return {
	loaded, load, mounted,//return loaded: server call sets true, true value goes over Nuxt Bridge, client call to .load() is a no-op
	serverDuration, pageDuration,

	user, codes,
}

})
