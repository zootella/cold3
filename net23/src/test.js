
import {
Sticker, runTests,
} from 'icarus'

export const handler = async (lambdaEvent, lambdaContext) => {
	let note = ''
	try {

		note = `lambda says: ${(await runTests()).message}, ${Sticker().all}`

	} catch (e) { note = 'ping test lambda error: '+e.stack }
	return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({note}) }
}

/* tiny tests run six places:
-- ./pages/ping/test.vue      nuxt page, server and client rendered
-- ./server/api/ping/test.js  nuxt api
-> ./net23/src/test.js        lambda
-- ./icarus/icarus.vue        vite
-- ./test.js                  node
*/
