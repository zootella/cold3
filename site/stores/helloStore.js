
import {
Sticker, log, look, Now, Tag, checkText, checkTag,
getBrowserTag, getBrowserGraphics, sequentialShared,
List,
indexRecords, hydratedRecords, addRecords, mergeRecords,
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

/*
//codes
const refCodesListA = ref([])//a ref on the array inside to watch hydration happen
const _codesList = List()//the List object database, importantly not a ref Pinia would try to serialize
_codesList.a = refCodesListA.value
const getCodesList = () => _codesList//a function to let you use it directly
watch([refCodesListA], () => {//when Pinia fills a, call .hydrated() to wire up o to match 
	if (_codesList.a.length > Object.keys(_codesList.o).length) _codesList.hydrated()
})
const visibleCodes = computed(() => {//from all that, filter to make the array for v-for to show a list on the page
	return refCodesListA.value.filter(code => code.show).reverse()//soonest to expire first
})
*/
let codesIndex
const codes = ref([])//codes this browser could enter, empty array before check or if none
const visibleCodes = computed(() => {//from all that, filter to make the array for v-for to show a list on the page
	return codes.value.filter(code => code.show).reverse()//soonest to expire first
})

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
		codesIndex = indexRecords(codes.value)
		/*
		_codesList.merge(r.codes)//this helper function will add items to _codesList.a!
		log('in hello store, merged in codes:', look(r.codes), refCodesListA.value.length)//so why, then, immediately after, is refCodesList.a still empty?
		*/

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
	codes, visibleCodes,
}

})
