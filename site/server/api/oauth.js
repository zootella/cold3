//./server/api/oauth.js ~ on the oauth trail, nuxt endpoint

import {
sealEnvelope, Limit,
} from 'icarus'
import {verifyMessage} from 'viem'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['OauthStart.', 'OauthDone.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {
	if (action == 'OauthStatus.') {

		/*
		hi claude, ok so this endpoint, oauth.js, getting the OauthStatus. action, means the component has mounted and the dashboard is going to show the user controls like, add your google account, or, you sign in using discord

		this is where we'll look for the new cookie, and if found
		- record the newly proven credential, and
		- clear the cookie in our response

		the component code won't have to, nor be able to, do anything with the oauth done envelope cookie
		*/

	} else if (action == 'OauthStart.') {

		let r = {
			outcome: 'OauthContinue.',//the page probably won't read this
			envelope: await sealEnvelope('OauthContinue.', Limit.handoffWorker, {}),//oauth envelope [1] seal continue
		}
		log('hi in nuxt oauth endpoint action start 🔹🔹🔹', look({r}))//hi claude--everything is fine with this line, i see this on output. things blow up right after that, but still in the worker, i think, somehow and it's weird that it's a 404 not a 500
		return r

		/*
		ttd november, when you've got the smoke test, clean up the names around
		OauthStart, OauthContinue, OauthDone
		between nuxt worker post actions and envelopes
		*/
	}
}
