
import {
Sticker, stickerParts, doorLambda, toss, log, look, defined, Task,
} from 'icarus'//remember the automatic nuxt icarus imports aren't here on the lambda side

import {
sendMessage,
} from '../persephone/persephone.js'

export const handler = async (lambdaEvent, lambdaContext) => {
	return await doorLambda('POST', {from: 'Worker.', actions: ['Gate.', 'Send.'], lambdaEvent, lambdaContext, doorHandleBelow})
}
async function doorHandleBelow({door, body, action}) {

	//report reachability to our manual CORS tests; application code doesn't use this action
	if (action == 'Gate.') return {success: true, sticker: Sticker()}

	if (action == 'Send.') {

		return await sendMessage({
			provider: body.provider,
			service: body.service,
			address: body.address,
			subjectText: body.subjectText,
			messageText: body.messageText,
			messageHtml: body.messageHtml,
		})
	}
}
