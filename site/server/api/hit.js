
import {
Sticker, log, look, Now, Tag, getAccess, checkText, textToInt, doorWorker,
settingReadInt, settingWrite,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Get.', 'Increment.'], workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let r = {}
	r.sticker = Sticker().all

	let h = await settingReadInt('hits', 0)

	if (action == 'Get.') {
	} else if (action == 'Increment.') {
		h++
		await settingWrite('hits', h)
	}

	r.hits = h
	return r
}
