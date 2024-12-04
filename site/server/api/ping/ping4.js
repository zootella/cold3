
import {
Sticker, doorWorker, Now, database_pingCount,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {

	let t = Now()
	let count = await database_pingCount()
	let duration = Now() - t

	return {note: `worker says: database took ${duration}ms to get count ${count}, ${Sticker().all}, ping4done`}
}
