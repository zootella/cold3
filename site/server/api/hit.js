
import {
settingReadInt, settingWrite,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Get.', 'Increment.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let task = {}
	task.hits = await settingReadInt('hits', 0)
	if (action == 'Increment.') {
		task.hits++
		await settingWrite('hits', task.hits)
	}
	task.success = true
	return task
}
