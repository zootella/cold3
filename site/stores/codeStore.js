
import {
Sticker, log, look, Now, Tag, checkText, checkTag,
getBrowserTag, getBrowserGraphics, sequentialShared,
} from 'icarus'
import {ref, computed} from 'vue'
import {defineStore} from 'pinia'

export const useCodeStore = defineStore('code_store', () => {

const records = ref([])//codes this browser could enter, empty array before check or if none
const placeCodes = function(a) { records.value = a }

const visibleCodes = computed(() => {
	return records.value.filter(code => code.show)
})

return {
	records, placeCodes, visibleCodes,
}

})
