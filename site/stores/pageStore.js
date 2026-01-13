//./stores/page.js - does nothing on the server, gains data as the page uses it

export const usePageStore = defineStore('pageStore', () => {

//turnstile
const renderTurnstileWidget = ref(false)//Button sets to true, causing BottomBar to render TurnstileComponent
const getTurnstileToken = ref(null)//TurnstileComponent sets a reference to its getToken function, and Button calls it

//page reported error
const errorDetails = ref(null)//hold error details from the error plugin, through error.vue, for error2 to report them

//notifcations
const notifications = ref([])
const addNotification = (message) => { notifications.value.unshift({tag: Tag(), tick: Now(), message}) }
const removeNotification = (tag) => { notifications.value = notifications.value.filter(item => item.tag != tag) }
//ttd december, okay, but couldn't there be a notification we know about during the server render, so it arrives with the page? maybe organizing stores around the universal render isn't the right pattern. also, maybe there should be a guard against running page-only code in the store itself, rather than just being careful where you call its methods in components

return {
	renderTurnstileWidget, getTurnstileToken,
	errorDetails,
	notifications, addNotification, removeNotification,
}

})
