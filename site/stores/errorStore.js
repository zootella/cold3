
import {
unloop,
} from 'icarus'
import {defineStore} from 'pinia'

export const useErrorStore = defineStore('error_store', () => {

const errors = ref([])
const add = (details) => {
	if (errors.value.length < Limit.errors) {
		errors.value.push({o: unloop(details), s: look(details)})
	} else {
		log('error store full!')
	}
}
const clear = () => {
	errors.value.length = 0//clears all the contents from the array, keeping its reference
}

return {
	errors, add, clear,
}

})
