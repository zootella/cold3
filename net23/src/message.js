
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

		let {warm, provider, service, address, message} = body

		if (warm) {
			await warm(provider+service)
		} else {
			response.result = await sendMessage(provider, service, address, message)
		}

	} catch (e) { response.error = e.stack }
	return response
}
