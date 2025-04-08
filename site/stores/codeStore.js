
import {
Sticker, log, look, Now, Tag, checkText, checkTag, List,
getBrowserTag, getBrowserGraphics, sequentialShared,
} from 'icarus'
import {ref, watch, computed} from 'vue'
import {defineStore} from 'pinia'

export const useCodeStore = defineStore('code_store', () => {
if (process.server) return {}//this store is only for the page

const _list = List()
const getList = () => _list
const refListA = ref(_list.a)

watch([refListA], () => {
	if (_list.a.length > Object.keys(_list.o).length) _list.hydrated()
})

const visibleCodes = computed(() => {
	return refListA.value.filter(code => code.show)//here i think we do have to use .value? (please confirm)
})

return {
	//note _list *not* returned
	getList,//function to access it
	refListA,//the array inside _list, which *must* be reactive, and which we *do* want to send across the bridge
	visibleCodes,//computed property, which will be the source of a v-if in a component
}

})
