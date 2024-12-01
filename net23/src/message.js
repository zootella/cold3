
import {
Sticker, doorLambda,
} from 'icarus'

import {
warm, sendMessage,
} from '../persephone/persephone.js'

export const handler = async (lambdaEvent, lambdaContext) => {
	return doorLambda({method: 'POST', lambdaEvent, lambdaContext, doorProcessBelow})
}
async function doorProcessBelow(door) {
	let response = {}
	try {

		let {warm, provider, service, address, message} = door.body

		if (warm) {
			await warm(provider+service)
		} else {
			response.result = await sendMessage(provider, service, address, message)
		}

	} catch (e) { response.error = e.stack }
	return response
}
