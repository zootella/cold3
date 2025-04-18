//./server/api/hit.js

import {
settingReadInt, settingWrite,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	//[] errorspot, nonessential but maybe a freebie if you get the nitro handler working
	return await doorWorker('POST', {actions: ['Get.', 'Increment.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	//[] errorspot, ...and down here

	let task = Task({name: 'hit api'})
	task.hits = await settingReadInt('hits', 0)
	if (action == 'Increment.') {
		task.hits++
		await settingWrite('hits', task.hits)
	}
	task.finish({success: true})
	return task
}
