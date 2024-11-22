
import {
Sticker, doorLambda,
} from 'icarus'

import {
warm, sendMessage,
} from '../persephone/persephone.js'

export const handler = async (lambdaEvent, lambdaContext) => {
	try {
		return doorLambda({lambdaEvent, lambdaContext, doorProcessBelow})
	} catch (e) { console.error('[OUTER]', e) }
	return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: null }
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
