
import {
Sticker, doorLambda, toss, log, look, defined, Task,
} from 'icarus'//remember the automatic nuxt icarus imports aren't here on the lambda side

import {
warm, sendMessage,
} from '../persephone/persephone.js'

export const handler = async (lambdaEvent, lambdaContext) => {
	return await doorLambda('POST', {lambdaEvent, lambdaContext, doorHandleBelow})
}
async function doorHandleBelow({door, body}) {
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
