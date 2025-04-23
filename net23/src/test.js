
import {
Sticker, doorLambda, log, look,
runTests,
} from 'icarus'

import {//not importing anything, but this lets tests get listed to run below
} from '../persephone/persephone.js'

export const handler = async (lambdaEvent, lambdaContext) => {
	return await doorLambda('POST', {lambdaEvent, lambdaContext, doorHandleBelow})
}
async function doorHandleBelow({door, body}) {
	return {note: `lambda says: ${(await runTests()).message}, ${Sticker().all}`}
}

/* tiny tests run six places:
-- ./pages/ping/test.vue      nuxt page, server and client rendered
-- ./server/api/ping/test.js  nuxt api
-> ./net23/src/test.js        lambda
-- ./icarus/icarus.vue        vite
-- ./test.js                  node
*/
