
import {
getBrowserTag, getBrowserGraphics, sequentialShared,
indexRecords, mergeRecords,
} from 'icarus'
import {defineStore} from 'pinia'

export const useHelloStore = defineStore('hello_store', () => {

//ready right away
const browserTag = ref('')

//ready after await hello1()
const error1 = ref(null)
const duration1 = ref(-1)
const sticker1 = ref('')//ttd march probably get rid of these stickers, but keep the durations
const user = ref({})//hello1 fills with browserTag and userTag, if there is one; hello2 adds name information

//ready after await hello2()
const error2 = ref(null)
const duration2 = ref(-1)
const sticker2 = ref('')
const connection = ref({})//ip address, geographic information, and browser information like user agent string
const cookieTag = ref('')

//codes
const codes = ref([])//codes this browser could enter, empty array before check or if none
const setCodes = (a2) => { if (!a2) a2 = []; codes.value = a2 }//ttd april, had trouble replacing the reference to a new array in components, even though that should work; doing that in this store method works fine. the lighter touch would be to clear and repopulate the array. and even that is short of comparing and updating the array only as needed

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
the eventual design that is best may also be quite simple:
there isn't a hello1 and hello2, there's just one hello
the browser sends the browser tag automatically with every GET and POST, so you have it from the first hit
a brand new visitor gets a brochure page from hello after a single ~150ms query, which is great
a returning, signed in, subscribed user's request takes longer, maybe ~500ms
the page goes from entirely blank to entirely populated for that user
this may be a better experience than, during 500ms, different parts of the page pop into existance

let's call this design the "quick monolith"
and, it can still be split into two, the first is everything necessary to completely get th epage ready
the second one records the hit, as well as documents the speed of the quick monolith, it's log only
ok, so it is hello1 and hello2, still
well actually, if you hit the database a lot of times, cloudflare may optimize near there
and, you can record the duration right in the endpoint
so yeah, let's go back to quick monolith after all
*/

const hello1 = sequentialShared(async () => {
	try {
		let t = Now()
		error1.value = null//clear a previous error

		browserTag.value = getBrowserTag()//comes from local storage, not the server, of course

		let r = await $fetch('/api/hello1', {method: 'POST', body: {
			browserTag: browserTag.value,
		}})
		sticker1.value = r.sticker
		user.value = r.user//minimal user object with .browserTag and, if there is one, .userTag

		duration1.value = Now() - t
	} catch (e) { error1.value = e }
})
const hello2 = sequentialShared(async () => {
	try {
		let t = Now()
		error2.value = null

		let r = await $fetch('/api/hello2', {method: 'POST', body: {
			browserTag: browserTag.value,
			browserGraphics: getBrowserGraphics(),//like browser tag, also comes from the browser
		}})
		sticker2.value = r.sticker
		user.value = r.user//more robust user object with .browserTag, .userTag, and names like .name.formFormal
		connection.value = r.connection
		cookieTag.value = r.cookieTag

		//codes
		codes.value = r.codes

		duration2.value = Now() - t
	} catch (e) { error2.value = e }
})

return {
	hello1, hello2,//call these methods to fetch data

	error1, duration1, sticker1,
	browserTag, user,

	error2, duration2, sticker2,
	connection, cookieTag,

	//codes
	codes, setCodes,
	//notifications
	notifications, addNotification, removeNotification,
}

})
