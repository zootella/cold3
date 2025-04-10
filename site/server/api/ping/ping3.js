
export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body}) {
	return {note: `worker says: ${Sticker().all}, ping3done`}
}
