//./stores/pageStore.js - does nothing on the server, gains data as the page uses it

export const usePageStore = defineStore('page_store', () => {

//turnstile
const renderWidget = ref(false)//PostButton sets to true, causing BottomBar to render TurnstileComponent
const getToken = ref(null)//TurnstileComponent sets a reference to its getToken function, and PostButton calls it

//page reported error
const details = ref(null)//hold error details from the error plugin, through error.vue, for error2 to report them

return {
	renderWidget, getToken,
	details,
}

})
