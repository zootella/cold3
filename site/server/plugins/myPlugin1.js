//./server/plugins/myPlugin1.js

import {
Sticker, log, look, Now, Tag, getAccess, checkText, textToInt, doorWorker,
settingReadInt, settingWrite,

sample1,
} from 'icarus'

export default defineNitroPlugin((nitroApp) => {

	//you can globalize icarus helpers here
	globalThis.sample1 = sample1

	//and maybe also pin nuxt functions so you can use them outside of nuxt files?!
	log('hi in my nitro plugin', look({useRuntimeConfig, setResponseStatus}))

	nitroApp.hooks.hook('nitro:request', (event) => {
		//but you can't get this per request hook to fire

		console.log('THIS WILL NEVER SHOW UP')
		context.note1 = 'added note in plugin!'
		//^and workerEvent.context.note1 is undefined in hit. js
	})
})








