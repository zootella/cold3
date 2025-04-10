
import {ref} from 'vue'
import {defineStore} from 'pinia'

export const useTurnstileStore = defineStore('turnstile_store', () => {

const renderWidget = ref(false)//PostButton sets to true, causing BottomBar to render TurnstileComponent
const getToken = ref(null)//TurnstileComponent sets a reference to its getToken function, and PostButton calls it

return {
	renderWidget, getToken,
}

})
