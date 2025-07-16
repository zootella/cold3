//./stores/page.js - does nothing on the server, gains data as the page uses it

export const usePageStore = defineStore('page', () => {

//turnstile
const renderTurnstileWidget = ref(false)//PostButton sets to true, causing BottomBar to render TurnstileComponent
const getTurnstileToken = ref(null)//TurnstileComponent sets a reference to its getToken function, and PostButton calls it

//page reported error
const errorDetails = ref(null)//hold error details from the error plugin, through error.vue, for error2 to report them

//notifcations
const notifications = ref([])
const addNotification = (message) => { notifications.value.unshift({tag: Tag(), tick: Now(), message}) }
const removeNotification = (tag) => { notifications.value = notifications.value.filter(item => item.tag != tag) }

return {
	renderTurnstileWidget, getTurnstileToken,
	errorDetails,
	notifications, addNotification, removeNotification,
}

})
