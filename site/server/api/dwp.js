
export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body}) {
	let r = {}

	let message = `${body.name}.${body.quantity}.${body.condition} from ${Sticker().all}`

	r.message = message
	r.when = Now()
	return r
}
