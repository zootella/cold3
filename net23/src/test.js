
import { seal } from '../../library/ping.js'

/* tiny tests run six places:
-- ./pages/ping/test.vue      nuxt page, server and client rendered
-- ./server/api/ping/test.js  nuxt api
-> ./net23/src/test.js        lambda
-- ./icarus/icarus.vue        vite
-- ./test.js                  node
*/
import { runTests } from '../../library/test.js'

export const handler = async (event) => {
	let note = ''
	try {

		note = `lambda says: ${(await runTests()).message}, ${seal().w3}`
		//note = `lambda says: *tests commented out for local speed*, ${seal().w3}`

	} catch (e) { note = 'ping test lambda error: '+e.stack }
	return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({note}) }
}
