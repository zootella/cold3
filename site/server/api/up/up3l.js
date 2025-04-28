
import {
runTestsSticker,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body}) {

	return {
		success: true,
		summary: (await fetchLambda('/up3')).summary,
	}
}
