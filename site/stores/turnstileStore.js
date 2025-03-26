
import {//./stores/turnstileStore.js
Sticker, log, look, Now, Tag, checkText, checkTag,
getBrowserTag, getBrowserGraphics, noOverlap,
} from 'icarus'
import {ref} from 'vue'
import {defineStore} from 'pinia'

export const useTurnstileStore = defineStore('turnstile_store', () => {

const renderWidget = ref(false)//PostButton sets to true, causing BottomBar to render TurnstileComponent

let savedFunction//note how this is not a ref
const doSaveFunction = (givenFunction) => {
	if (savedFunction) return//only store the given function once

	savedFunction = givenFunction
}
const doCallFunction = async () => {
	if (!renderWidget.value) { log('state mistake, not enabled yet!');       return }
	if (!savedFunction)      { log('state mistake, no function saved yet!'); return }

	return await savedFunction()
	/*
	note for a todo later:
	we need a promise mechanism here that only lets one caller in at a time
	if there's already a caller awaiting, the next caller waits in line before entering once the first has returned
	there could be a longer line of awaiting callers, too!
	*/
}

return {
	renderWidget,
	doSaveFunction, doCallFunction,
}

})
