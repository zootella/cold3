
import {
Sticker, doorLambda,
} from 'icarus'

import {
warm, sendMessage,
} from '../persephone/persephone.js'

export const handler = async (lambdaEvent, lambdaContext) => {
	return await doorLambda('POST', {lambdaEvent, lambdaContext, doorHandleBelow})
}
async function doorHandleBelow({door, body, action}) {

	if (body.warm) {
		return await warm({provider: body.provider, service: body.service})
	} else {
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
