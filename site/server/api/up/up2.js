




export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body}) {
	return {
		success: true,
		note: (await fetchLambda('/up2')).note,
	}
}
