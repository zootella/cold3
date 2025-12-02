//./server/api/oauth.js ~ on the oauth trail, nuxt endpoint

import {
sealEnvelope,
} from 'icarus'
import {verifyMessage} from 'viem'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['OauthStart.', 'OauthDone.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, browserHash, body, action, letter}) {
	if (action == 'OauthStart.') {

		return {
			outcome: 'OauthContinue.',//the page probably won't read this
			envelope: await sealEnvelope('OauthContinue.', Limit.handoffWorker, {}),//oauth envelope [1] seal continue
		}

	} else if (action == 'OauthDone.') {//page calls back with signature of the nonce we gave it

		//ttd november, we'll get to this soon



	}
}
