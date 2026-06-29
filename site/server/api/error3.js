//on the error trail: error3 — the surface for errors that arise outside our normal page/fetchWorker flow

/*
Most errors reach error.vue on their own: a toss during a page render, or a fetchWorker call that gets a 500, is caught by
errorPlugin's hooks. But an error that arrives as a browser navigation straight to a server endpoint has no page or
fetchWorker in the loop, so it can't reach those hooks. error3 is the bridge: a catcher seals the error into an Error3.
envelope and redirects the browser to error3.vue, which posts it here; running inside doorWorker (keys decrypted), the
toss below both logs to Datadog and blows up error.vue. The catchers that feed error3 are the oauth endpoint's
membrane and its governance block (site/server/api/oauth/[...all].js).
*/

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Error3.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {
	if (action == 'Error3.') {

		let letter = await openEnvelope('Error3.', body.envelope)
		toss('error3', {error: letter.error})//use toss to both log to datadog and blow up the page for the user
	}
}
