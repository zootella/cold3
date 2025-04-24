
import {
runTests,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body}) {

	let workerNote = (await runTests()).message
	let lambdaNote = (await $fetch(
		host23() + '/test',
		{
			method: 'POST',
			body: {
				ACCESS_NETWORK_23_SECRET: (await getAccess()).get('ACCESS_NETWORK_23_SECRET')
			}
		}
	)).note

	return {note: `worker says: ${workerNote}, ${Sticker().all}; ${lambdaNote}`}
}
/*
ttd april, necessary bike shed improvements
[]refactor to use fetchNet23 or whatever you call that
[]line up green checks, where, and hashes, this is what you look at
[]the page should show up even while the tests are rolling in
[]make a [Run] button which reruns the tests
[]make a ping6done that only shows with three green checkmarks, and hookup to checkly
*/

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
the tags CloudPageServer and CloudPageClient are both there correctly, and it makes sense that code can access more tests in the full browser

curl: worker says:       ✅ 286 assertions in 35 tests ..., CloudNuxtServer: Aclo.Envi.Proc.Scri.Self.Zulu,           1726687578966
page: worker says:       ✅ 456 assertions in 40 tests ..., CloudNuxtServer: Aclo.Envi.Proc.Scri.Self.Zulu,           1726687560371
here, we're fetching an API endpoint, but interestingly, the server hydrated fetch is just like CloudPageServer--so maybe it doesn't really fetch, it just calls?

curl: lambda says:       ✅ 458 assertions in 41 tests ..., CloudLambda:     Eigh.Envi.Glob.Lamb.Node.Proc.Regi.Zulu, 1726687579024
page: lambda says:       ✅ 458 assertions in 41 tests ..., CloudLambda:     Eigh.Envi.Glob.Lamb.Node.Proc.Regi.Zulu, 1726687560384
amazon is totally separate from nuxt so these sorta have to be the same
*/
