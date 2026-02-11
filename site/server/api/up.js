
import {
runTestsSticker,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Up2.', 'Up3w.', 'Up3l.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {

	if (action == 'Up2.')  return {success: true, note: (await fetchLambda('/message', {body: {action: 'Up2.'}})).note}
	if (action == 'Up3w.') return {success: true, summary: (await runTestsSticker()).summary}
	if (action == 'Up3l.') return {success: true, summary: (await fetchLambda('/message', {body: {action: 'Up3.'}})).summary}
}
