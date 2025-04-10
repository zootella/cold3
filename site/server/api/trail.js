
import {
doorWorker, log, look, toss, Now, Tag, getAccess,//ttd february, maybe, *maybe*, now that the project structure has settled down, pick a small repertoire and define them in that thing that means the're available everywhere in nuxt components and endpoints and stores and plugins. but back out again if there's any trouble, just like you did the last time!
checkTextOrBlank, Time, hashText,
trailCount, trailRecent, trailAdd,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Get.', 'Set.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let r = {}
	r.sticker = Sticker().all

	checkTextOrBlank(body.message)
	let h = await hashText(body.message)
	r.hash = h

	if (action == 'Get.') {
		r.count = await trailCount({hash: h, since: Now() - 30*Time.second})
		r.recent = await trailRecent({hash: h})
	} else if (action == 'Set.') {
		await trailAdd({hash: h})
	}

	return r
}
