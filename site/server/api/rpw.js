
import {
Sticker, log, look, Now, Tag, getAccess, checkText,
doorWorker,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {

	let u = Sticker().isCloud ? 'https://api.net23.cc' : 'http://localhost:4000/prod'
	u += '/rpl'
	let bridge = await $fetch(u, {method: 'POST', body: {name: 'rpw', ACCESS_NETWORK_23_SECRET: (await getAccess()).get('ACCESS_NETWORK_23_SECRET')}})

	let o = {}
	o.name = 'rpw'
	o.sticker = Sticker().all
	o.method = door.workerEvent.req.method
	o.headers = door.workerEvent.req.headers

	o.bridge = bridge
	return o
}

/*
ttd december, you've got R1,2,3,4 + dbg,dwp,rgw,rpw, and more in a door cors test mess
clean all that up now!
*/
