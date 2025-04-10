
//this file is ./plugins/plugin1.js

import {
Sticker, log, look, Now, Tag, getBrowserTag, checkText, hasText, awaitDog,
getBrowserGraphics, awaitLogAlert,
} from 'icarus'

export default defineNuxtPlugin(async (nuxtApp) => {

	const helloStore = useHelloStore()
	await helloStore.hello1()//$fetch-es to /api/hello1 on first call, does not do that on later calls
	//await hello1, as a whole bunch of components will render depending on helloStore.userTag or not
	//but don't await this one, just get it started now, when the page hits a new tab, and let it happen in a moment after there are already components on the page
	/*no await*/helloStore.hello2()
})
