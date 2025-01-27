
import {
Sticker,
log, look, Now, Tag, getAccess, checkText, textToInt,
doorWorker,
dog,
settingReadInt, settingWrite,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}

	o.message = 'hi from api count'
	o.mirroredBody = door.body

	let g = await settingReadInt('hits', 0)//default 0 in case this makes the row
	if (door.body.countGlobal > 0) {//increment
		g += door.body.countGlobal//increment with requested value
		await settingWrite('hits', g)//write
	}

	o.countGlobal = g
	o.countBrowser = 0
	o.count1 = g
	o.count2 = 0

	return o
}
