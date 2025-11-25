//./server/api/oauth.js ~ on the oauth trail, nuxt endpoint

import {
encryptSymmetric,
} from 'icarus'
import {verifyMessage} from 'viem'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['OauthStart.', 'OauthDone.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {
	const symmetric = encryptSymmetric(Key('envelope, secret'))
	if (action == 'OauthStart.') {

		return {
			outcome: 'Continue.',//probably won't read this
			envelope: await symmetric.encryptObject({
				dated: Now(),//only part that matters
				tag: Tag(),//just filler
			})
		}

	} else if (action == 'OauthDone.') {//page calls back with signature of the nonce we gave it

		//ttd november, we'll get to this soon



	}
}
