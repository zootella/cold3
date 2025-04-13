
import {
getBrowserTag, getBrowserGraphics, sequentialShared,
indexRecords, mergeRecords,
} from 'icarus'
import {ref, watch} from 'vue'
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

//codes
const codes = ref([])//codes this browser could enter, empty array before check or if none
const setCodes = (a2) => { if (!a2) a2 = []; codes.value = a2 }//ttd april, had trouble replacing the reference to a new array in components, even though that should work; doing that in this store method works fine. the lighter touch would be to clear and repopulate the array. and even that is short of comparing and updating the array only as needed

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
	connection,

	//codes
	codes, setCodes,
}

})
