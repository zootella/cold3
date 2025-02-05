
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

		log('hello2 result', look(r))
	} catch (e) { error2.value = e }
	duration2.value = Now() - t
})

return {
	hello1, hello2,
	browserTag, browserGraphics,
	error1, duration1, sticker1,
	error2, duration2, sticker2,
	userTag, userName,
}

})









