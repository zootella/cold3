//./server/api/oauth.js ~ on the oauth trail, nuxt endpoint

import {
encryptSymmetric,
} from 'icarus'
import {verifyMessage} from 'viem'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['OauthStart.', 'OauthDone.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, browserHash, body, action, letter}) {
	const symmetric = encryptSymmetric(Key('envelope, secret'))
	if (action == 'OauthStart.') {

		return {
			outcome: 'OauthContinue.',//the page probably won't read this
			envelope: await symmetric.encryptObject({
				action: 'OauthContinue.',//unique action prevents a page from replaying an envelope to the sveltekit endpoint
				expiration: Now() + Limit.handoffWorker,
			})
		}

	} else if (action == 'OauthDone.') {//page calls back with signature of the nonce we gave it

		//ttd november, we'll get to this soon



	}
}
