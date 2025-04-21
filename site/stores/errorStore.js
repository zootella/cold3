//./stores/errorStore.js

export const useErrorStore = defineStore('error_store', () => {

const details = ref(null)//hold error details from the error plugin, through error.vue, for error2 to report them

return {
	details,
}

})
