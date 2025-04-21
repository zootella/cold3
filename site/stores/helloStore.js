
import {
getBrowserGraphics, sequentialShared,
indexRecords, mergeRecords,
} from 'icarus'
import {defineStore} from 'pinia'

export const useHelloStore = defineStore('hello_store', () => {

const error1 = ref(null)
const duration1 = ref(-1)
const sticker1 = ref('')//ttd march probably get rid of these stickers, but keep the durations

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

const loaded = ref(false)
async function load() { if (loaded.value) return; loaded.value = true
	try {
		let t = Now()
		error1.value = null//clear a previous error

		const requestFetch = useRequestFetch()//ttd april, bonkers that you have to get the function from a composable, but whatever
		let r = await requestFetch('/api/hello1', {method: 'POST', body: {}})
		sticker1.value = r.sticker
		user.value = r.user
		codes.value = r.codes

		duration1.value = Now() - t
	} catch (e) { error1.value = e }
}

return {
	loaded, load,

	error1, duration1, sticker1,
	user,

	codes, setCodes,
	notifications, addNotification, removeNotification,
}

})
