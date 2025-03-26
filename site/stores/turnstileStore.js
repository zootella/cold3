
import {//./stores/turnstileStore.js
Sticker, log, look, Now, Tag, checkText, checkTag,
getBrowserTag, getBrowserGraphics, noOverlap,
} from 'icarus'
import {ref} from 'vue'
import {defineStore} from 'pinia'

export const useTurnstileStore = defineStore('turnstile_store', () => {

const error1 = ref(null)
const duration1 = ref(-1)
const sticker1 = ref('')

const hello1 = noOverlap(async () => {
	try {
		let t = Now()
		error1.value = null//clear a previous error


		duration1.value = Now() - t
	} catch (e) { error1.value = e }
})

return {
	hello1,

	error1, duration1, sticker1,
}

})
