
import {
origin23,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door}) {

	let bridge = await $fetch(
		origin23() + '/gate-post-lambda',
		{
			method: 'POST',
			body: {
				name: 'GatePostWorker.',
				envelope: await sealEnvelope('Network23.', Limit.handoffLambda, {}),
			}
		}
	)

	let r = {}
	r.name = 'GatePostWorker.'
	r.sticker = Sticker()
	r.method = door.workerEvent.req.method
	r.headers = makePlain(door.workerEvent.req.headers); delete r.headers.cookie//make plain to copy the object and delete the browser tag cookie from the copy. Never leak the browser tag to the page!
	r.success = true

	r.bridge = bridge
	return r
}
