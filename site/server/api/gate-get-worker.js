
export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('GET', {workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door}) {












	let r = {}
	r.name = 'GateGetWorker.'
	r.sticker = Sticker().all
	r.method = door.workerEvent.req.method
	r.headers = door.workerEvent.req.headers
	r.success = true


	return r
}
