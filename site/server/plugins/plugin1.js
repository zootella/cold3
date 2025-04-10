//./server/plugins/plugin1.js

import {
Sticker, log, look, Now, Tag, getAccess, checkText, textToInt, doorWorker,
test, ok,

sample1,
} from 'icarus'

export default defineNitroPlugin((nitroApp) => {

	//make icarus functions available in nuxt server code and the library code it calls
	if (!globalThis.sample1 && sample1) globalThis.sample1 = sample1

	//make nuxt helper functions available everywhere, also
	if (!globalThis.useRuntimeConfig && typeof useRuntimeConfig == 'function') globalThis.useRuntimeConfig = useRuntimeConfig
	if (!globalThis.setResponseStatus && typeof setResponseStatus == 'function') globalThis.setResponseStatus = setResponseStatus
})
