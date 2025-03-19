
import {
Sticker, doorLambda,
} from 'icarus'

import {
warm, sendMessage,
} from '../persephone/persephone.js'

export const handler = async (lambdaEvent, lambdaContext) => {
	return doorLambda('POST', {lambdaEvent, lambdaContext, doorHandleBelow})
}
async function doorHandleBelow({door, body, action}) {
	let response = {}
	try {

		if (body.warm) {
			await warm(body.provider+body.service)
		} else {
			response.result = await sendMessage({
				provider: body.provider,
				service: body.service,
				address: body.address,
				subjectText: body.subjectText,
				messageText: body.messageText,
				messageHtml: body.messageHtml,
			})
		}

	} catch (e) { response.error = e.stack }
	return response
}
