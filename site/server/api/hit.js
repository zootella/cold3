
import {
settingReadInt, settingWrite,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Get.', 'Increment.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let response = {}
	response.hits = await settingReadInt('hits', 0)
	if (action == 'Increment.') {
		response.hits++
		await settingWrite('hits', response.hits)
	}
	response.success = true
	return response
}
