//on the oauth trail, nuxt endpoint

import {verifyMessage} from 'viem'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['OauthStatus.', 'OauthStart.', 'OauthDone.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {
	if (action == 'OauthStatus.') {


	} else if (action == 'OauthStart.') {

		return {
			outcome: 'OauthContinue.',
			envelope: await sealEnvelope('OauthContinue.', Limit.handoffWorker, {}),//oauth envelope [1] seal continue
		}

	} else if (action == 'OauthDone.') {

		let letter = await openEnvelope('OauthDone.', body.envelope, {browserHash})//oauth envelope [4] open done
		log('letter arrived in worker 📩 now in oauth.js OauthDone!!', look(letter))
		//we've made sure the browserHash sveltekit computed from the browserTag matches, but still need to
		//save the proven credentials in the database
		//and chose what route to send the user, ttd november

		return {
			outcome: 'OauthProven.',
			route: '/',//ttd november, will change to welcome, home, or dashboard depending on the user's aim proving oauth
		}
	}
	/*
	ttd november, when you've got the smoke test, clean up the names around
	OauthStart, OauthContinue, OauthDone
	between nuxt worker post actions and envelopes
	*/
}
