
import {
host23,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door}) {

	let bridge = await $fetch(
		host23() + '/rpl',
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
