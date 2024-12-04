
import {
Sticker, doorWorker, Now, getAccess, runTests,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {

	let workerNote = (await runTests()).message
	let lambdaNote = (await $fetch(
		Sticker().isCloud ? 'https://api.net23.cc/test' : 'http://localhost:4000/prod/test',
		{method: 'POST', body: {ACCESS_NETWORK_23_SECRET: (await getAccess()).get('ACCESS_NETWORK_23_SECRET')}
		})).note

	return {note: `worker says: ${workerNote}, ${Sticker().all}; ${lambdaNote}`}
}

/* tiny tests run six places:
-- ./pages/ping/test.vue      nuxt page, server and client rendered
-> ./server/api/ping/test.js  nuxt api
-- ./net23/src/test.js        lambda
-- ./icarus/icarus.vue        vite
-- ./test.js                  node
*/

/*
2024sep18 curled and then copied rendered page, and it's weird!

curl: script setup says: ✅ 286 assertions in 35 tests ..., CloudPageServer: Envi.Proc.Scri.Self.Serv.Zulu,           1726687578574
page: script setup says: ✅ 458 assertions in 41 tests ..., CloudPageClient: Achr.Asaf.Awin.Docu.Doma.Self.Stor.Wind, 1726687559648
the tags CloudPageServer and CloudPageClient are both there correctly, and it makes sense that hydration can access more tests in the full browser

curl: worker says:       ✅ 286 assertions in 35 tests ..., CloudNuxtServer: Aclo.Envi.Proc.Scri.Self.Zulu,           1726687578966
page: worker says:       ✅ 456 assertions in 40 tests ..., CloudNuxtServer: Aclo.Envi.Proc.Scri.Self.Zulu,           1726687560371
here, we're fetching an API endpoint, but interestingly, the server hydrated fetch is just like CloudPageServer--so maybe it doesn't really fetch, it just calls?

curl: lambda says:       ✅ 458 assertions in 41 tests ..., CloudLambda:     Eigh.Envi.Glob.Lamb.Node.Proc.Regi.Zulu, 1726687579024
page: lambda says:       ✅ 458 assertions in 41 tests ..., CloudLambda:     Eigh.Envi.Glob.Lamb.Node.Proc.Regi.Zulu, 1726687560384
amazon is totally separate from nuxt so these sorta have to be the same
*/
