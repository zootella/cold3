
import {
Sticker, log, look, Now, Tag, getAccess, checkText,
doorWorker, urlNetwork23,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {

	let bridge = await $fetch(
		urlNetwork23() + '/rpl',
		{
			method: 'POST',
			body: {
				name: 'rpw',
				ACCESS_NETWORK_23_SECRET: (await getAccess()).get('ACCESS_NETWORK_23_SECRET')
			}
		}
	)

	let r = {}
	r.name = 'rpw'
	r.sticker = Sticker().all
	r.method = door.workerEvent.req.method
	r.headers = door.workerEvent.req.headers

	r.bridge = bridge
	return r
}

/*
ttd december, you've got R1,2,3,4 + dbg,dwp,rgw,rpw, and more in a door cors test mess
clean all that up now!
*/
