//./server/api/hit.js

import {
settingReadInt, settingWrite,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	//[] errorspot, event handler function that gets called from a store on the server, and later from a page; up here,
	//notDefined

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
