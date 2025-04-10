
import {
settingReadInt, settingWrite,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body}) {
	let r = {}

	r.message = 'hi from api count'
	r.mirroredBody = body

	let g = await settingReadInt('hits', 0)//default 0 in case this makes the row
	if (body.countGlobal > 0) {//increment
		g += body.countGlobal//increment with requested value
		await settingWrite('hits', g)//write
	}

	r.countGlobal = g
	r.countBrowser = 0
	r.count1 = g
	r.count2 = 0

	return r
}
