
export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['SmokeTestEnvelope.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {

	if (action == 'SmokeTestEnvelope.') {//page requests an upload envelope so we can smoke test the Lambda with curl, ttd january

		let envelope = await sealEnvelope('Net23Upload.', Time.minute, {})//sealed as Net23Upload. because that's what the Lambda opens; expires in 1 minute

		return {
			success: true,
			envelope,
		}
	}
}
