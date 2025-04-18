//./server/api/hit.js

import {
settingReadInt, settingWrite,
} from 'icarus'
//[~]errorspot, local won't even start

export default defineEventHandler(async (workerEvent) => {
	//[x] errorspot, hit downstream on both server and client rendering
	return await doorWorker('POST', {actions: ['Get.', 'Increment.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	//[x] errorspot

	let task = Task({name: 'hit api'})
	task.hits = await settingReadInt('hits', 0)
	if (action == 'Increment.') {
		task.hits++
		await settingWrite('hits', task.hits)
	}
	task.finish({success: true})
	return task
}
