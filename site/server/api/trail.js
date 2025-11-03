
import {
hashText,
trailCount, trailRecent, trailAdd,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Get.', 'Set.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let r = {}
	r.sticker = Sticker()

	checkTextOrBlank(body.message)
	let h = await hashText(body.message)
	r.hash = h

	if (action == 'Get.') {
		r.count = await trailCount({hash: h, since: Now() - (30*Time.second)})
		r.recent = await trailRecent({hash: h})
	} else if (action == 'Set.') {
		await trailAdd({hash: h})
	}

	return r
}
