
import {
Sticker, log, look, Now, Tag, getAccess, checkText, textToInt, doorWorker,
settingReadInt, settingWrite,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}
	o.sticker = Sticker().all

	let h = await settingReadInt('hits', 0)

	if (door.body.action == 'Get.') {
	} else if (door.body.action == 'Increment.') {
		h++
		await settingWrite('hits', h)
	} else { toss('action', {door}) }

	o.hits = h
	return o
}
