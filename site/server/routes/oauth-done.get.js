//./server/routes/oauth-done.get.js

import {
openEnvelope,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('GET', {workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, query, browserHash}) {

	// check for the test cookie from sveltekit
	let cookieName = 'oauth_done'
	let secureCookieName = '__Secure-oauth_done'
	let testCookie = getCookie(door.workerEvent, cookieName)
	let secureTestCookie = getCookie(door.workerEvent, secureCookieName)
	dog('oauth_done cookie check:', {
		[cookieName]: testCookie ? `found (${testCookie.length} chars)` : 'not found',
		[secureCookieName]: secureTestCookie ? `found (${secureTestCookie.length} chars)` : 'not found',
	})

	let letter = await openEnvelope('OauthDone.', query.envelope)//oauth envelope [4] open done
	dog('letter arrived in worker 📩', look(letter))
	//now we'll save the proven credential in the database
	//and below, choose what route to send the user to, ttd november

	/*
	hi claude, ok, so with the new flow, this nuxt GET endpoint goes away completely
	and we go back to before, when nuxt has only POST endpoints, which is great

	but for right now, let's write some code to look for the cookie we set. i can't find it in devtools!
	*/

	return sendRedirect(door.workerEvent, '/', 302)
}
