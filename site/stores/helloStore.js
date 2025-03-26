
import {
Sticker, log, look, Now, Tag, checkText, checkTag,
getBrowserTag, getBrowserGraphics, sequentialShared,
} from 'icarus'
import {ref} from 'vue'
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
const codes = ref([])//currently live one time codes the person at this browser should find and enter!

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
		codes.value = r.codes

		duration2.value = Now() - t
	} catch (e) { error2.value = e }
})

return {
	hello1, hello2,//call these methods to fetch data

	error1, duration1, sticker1,
	browserTag, user,

	error2, duration2, sticker2,
	connection, codes,
}

})
