
import { pingEnvironment } from '@/library/ping.js'

/* tiny tests run six places:
-- ./pages/ping/test.vue      nuxt page, server and client rendered
-> ./server/api/ping/test.js  nuxt api
-- ./net23/src/test.js        lambda
-- ./icarus/icarus.vue        vite
-- ./test.js                  node
*/
import { runTests } from '@/library/test.js'

export default defineEventHandler(async (event) => {
	let note = ''
	try {

		let workerNote = (await runTests()).message
		let lambdaNote = (await $fetch('https://api.net23.cc/test')).note
		note = `worker says: ${workerNote}, ${pingEnvironment()}; ${lambdaNote}`

	} catch (e) { note = 'ping test worker error: '+e.stack }
	return {note}
})
