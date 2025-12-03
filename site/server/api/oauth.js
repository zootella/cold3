//./server/api/oauth.js ~ on the oauth trail, nuxt endpoint

import {
sealEnvelope,
} from 'icarus'
import {verifyMessage} from 'viem'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['OauthStatus.', 'OauthStart.', 'OauthDone.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {
	if (action == 'OauthStatus.') {


	} else if (action == 'OauthStart.') {

		let r = {
			outcome: 'OauthContinue.',//the page probably won't read this
			envelope: await sealEnvelope('OauthContinue.', Limit.handoffWorker, {}),//oauth envelope [1] seal continue
		}
		return r

	} else if (action == 'OauthDone.') {

	}
	/*
	ttd november, when you've got the smoke test, clean up the names around
	OauthStart, OauthContinue, OauthDone
	between nuxt worker post actions and envelopes
	*/
}
