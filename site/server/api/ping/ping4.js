
import {
Sticker, doorWorker, Now, settingReadInt, textToInt,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {

	let t = Now()
	let count = await settingReadInt('hits', 0)
	let duration = Now() - t

	return {note: `worker says: database took ${duration}ms to get count ${count}, ${Sticker().all}, ping4done`}
}
