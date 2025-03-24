
import {
Sticker, doorWorker,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow})
})
async function doorHandleBelow({door, body}) {
	return {note: `worker says: ${Sticker().all}, ping3done`}
}
