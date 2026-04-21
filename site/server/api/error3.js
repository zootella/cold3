//on the error trail: Nuxt catcher's mitt for exceptions from SvelteKit (back end)

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Error3.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {
	if (action == 'Error3.') {

		let letter = await openEnvelope('Error3.', body.envelope)
		toss('error3', {error: letter.error})//use toss to both log to datadog and blow up the page for the user
	}
}
