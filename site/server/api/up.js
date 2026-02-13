
import {
runTestsSticker,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Up2.', 'Up3Worker.', 'Up3Lambda.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {

	if (action == 'Up2.')  return {success: true, note: (await fetchLambda({from: 'Worker.', route: '/message', action: 'Up2.'})).note}
	if (action == 'Up3Worker.') return {success: true, summary: (await runTestsSticker()).summary}
	if (action == 'Up3Lambda.') return {success: true, summary: (await fetchLambda({from: 'Worker.', route: '/message', action: 'Up3.'})).summary}
}
