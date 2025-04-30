
export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door}) {

	let bridge = await $fetch(
		host23() + '/gate-post-lambda',
		{
			method: 'POST',
			body: {
				name: 'GatePostWorker.',
				ACCESS_NETWORK_23_SECRET: (await getAccess()).get('ACCESS_NETWORK_23_SECRET')
			}
		}
	)

	let r = {}
	r.name = 'GatePostWorker.'
	r.sticker = Sticker().all
	r.method = door.workerEvent.req.method
	r.headers = makePlain(door.workerEvent.req.headers)//ttd april, using make plan to copy the object
	delete r.headers.cookie//to be able to delete the browser tag cookie without changing the worker event
	r.success = true

	r.bridge = bridge
	return r
}
