
import {
trailCount, trailRecent, trailAdd,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Get.', 'Set.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let r = {}
	r.sticker = Sticker()

	checkTextOrBlank(body.message)

	if (action == 'Get.') {
		r.count = await trailCount(body.message, 30*Time.second)
		r.recent = await trailRecent(body.message)
	} else if (action == 'Set.') {
		await trailAdd(body.message)
	}

	return r
}
