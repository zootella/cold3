
import {
Sticker, log, look, Now, Tag, checkText, checkTag,
getBrowserTag, getBrowserGraphics, noOverlap,
} from 'icarus'
import {ref} from 'vue'
import {defineStore} from 'pinia'

export const useHelloStore = defineStore('hello_store', () => {

//ready right away
const browserTag = ref('')

//ready after await hello1()
const error1 = ref(null)
const duration1 = ref(-1)
const sticker1 = ref('')
const userTag = ref('')

//ready after await hello2()
const browserGraphics = ref(null)
const error2 = ref(null)
const duration2 = ref(-1)
const sticker2 = ref('')
const userName = ref('')
const ipAddress = ref('')
const userAgent = ref('')
const geography = ref(null)

const hashValue = ref('')
const hashDuration = ref(-1)
const codes = ref([])

//^ttd february--is this an application for reactive instead of ref? does that report updates when you just change one little thing within, or even two hops down, a big object? ask chat and also test that out

// Actions
const hello1 = noOverlap(async () => {
	let t = Now()
	error1.value = null//clear a previous error
	browserTag.value = getBrowserTag()
	try {
		let r = await $fetch('/api/hello1', {method: 'POST', body: {
			browserTag: browserTag.value,
		}})
		sticker1.value = r.sticker
		userTag.value = r.userTag
	} catch (e) { error1.value = e }
	duration1.value = Now() - t
})
const hello2 = noOverlap(async () => {
	let t = Now()
	error2.value = null
	browserGraphics.value = getBrowserGraphics()
	try {
		let r = await $fetch('/api/hello2', {method: 'POST', body: {
			browserTag: browserTag.value,
			browserGraphics: browserGraphics.value,
		}})
		sticker2.value = r.sticker
		userTag.value = r.userTag
		userName.value = r.userName

		ipAddress.value = r.ipAddress
		userAgent.value = r.userAgent
		geography.value = {country: r.geoCountry, city: r.geoCity, region: r.geoRegion, postal: r.geoPostal}

		hashValue.value = r.hashValue
		hashDuration.value = r.hashDuration

		codes.value = r.codes

	} catch (e) { error2.value = e }
	duration2.value = Now() - t
})
/*
ttd march
you've split this into hello1 and hello2 so that
hello1 can, in a single 150ms query, determine if there's a user here or if this is a new browser
ostensibly, the page can use this to render one whole set of components, or another

but you realize now you could combine these as follows
if there is no user at this browser, hello could get back in two parallel database queries (browser to user, and record hit)
and if there is, then the user needs to wait for more queries anyway

take a look at this when you also do the customizataions related to the route on the first GET
it has been said, premature optimization is bad--everything's fine so long as the site loads in <500ms, so you have time here
*/

return {
	hello1, hello2,
	browserTag, browserGraphics,
	error1, duration1, sticker1,
	error2, duration2, sticker2,
	userTag, userName,
	ipAddress, userAgent, geography,

	hashValue, hashDuration,
	codes,
}

})
