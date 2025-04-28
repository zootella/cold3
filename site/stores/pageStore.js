//./stores/pageStore.js
/*
mainStore - loads on server, updates on page as user clicks
flexStore - loads on server or page, depending on the GETed route, for demonstration in development
pageStore - starts empty on server and client at the start, updates on page
*/

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
