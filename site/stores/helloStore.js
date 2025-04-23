
import {
getBrowserGraphics, sequentialShared,
indexRecords, mergeRecords,
} from 'icarus'

export const useHelloStore = defineStore('hello_store', () => {

let context//get existing context, if any, to use during SSR for the fetch below
if (process.server) context = useNuxtApp()?.ssrContext?.event?.context//only applicable during SSR
if (!context) context = {}

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
//ttd april, get rid of these methods now that you understand when to use .value in a store!

const loaded = ref(false)
async function load() { if (loaded.value) return; loaded.value = true
	try {
		let t = Now()
		error1.value = null//clear a previous error

		let f = {method: 'POST', body: {}}
		if (context.browserTag) f.headers = {cookie: composeCookie(context.browserTag).cookieHeaderValue}//a new tab's GET is causing this all to render on the server, so the fetch below will actually be a function call, and we must include the cookie we got, or have chosen to set, with the browser
		let r = await $fetch('/api/hello1', f)
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

//ttd april, duplicating this to avoid warning about circular reference without spending more time on it
const cookieSecurePrefix = '__Secure-'//causes browser to reject the cookie unless we set Secure and connection is HTTPS
const cookieNameWarning  = 'current_session_password'
const cookieValueWarning = 'account_access_code_DO_NOT_SHARE_'//wording these two to discourage coached tampering
function composeCookie(tag) {
	let name = cookieNameWarning
	let options = {//these base options work for local development...
		path: '/',//send for all routes
		httpOnly: true,//page script can't see or change; more secure than local storage! 
		sameSite: 'Lax',//send with the very first GET; block cross‑site subrequests like iframes, AJAX calls, images, and forms
		maxAge: 395*24*60*60,//expires in 395 days, under Chrome's 400 day cutoff; seconds not milliseconds
	}
	if (isCloud()) {//...strengthen them for cloud deployment
		name = cookieSecurePrefix + name
		options.secure = true
		options.domain = 'cold3.cc'//apex domain and subdomains allowed; ttd april get in access or wrapper, not hardcoded! you can also omit, but then the cookie is locked to the domain without subdomains
	}
	let o = {name, options}
	if (hasTag(tag)) {
		o.value = `${cookieValueWarning}${tag}`//assemble a value for a cookie we'll tell it to set with our eventual response
		o.cookieHeaderValue = `${name}=${cookieValueWarning}${tag}`//cookie header value with name and value together
	}
	return o
}
function cookieValueToTag(value) {
	if (
		hasText(value) &&//got something,
		value.length == cookieValueWarning.length+Limit.tag &&//length looks correct,
		value.startsWith(cookieValueWarning)) {//and prefix is intact,
		let tag = value.slice(-Limit.tag)//slice out the tag at the end of the cookie value
		if (hasTag(tag)) {//and check it before we return it
			return tag
		}
	}
	return false//if any of that didn't work, don't throw, just return false
}
