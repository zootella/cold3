//./stores/errorStore.js

import {defineStore} from 'pinia'

export const useErrorStore = defineStore('error_store', () => {

const details = ref(null)//hold error details from the error plugin, through error.vue, for error2 to report them

return {
	details,
}

})
