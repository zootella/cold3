
const { loadIcarus, warmMessage, sendMessage } = require('../persephone/persephone.js');

exports.handler = async (lambdaEvent, lambdaContext) => {
	try {
		let { doorLambda } = await loadIcarus()
		return doorLambda({lambdaEvent, lambdaContext, doorProcessBelow})
	} catch (e) { console.error('[OUTER]', e) }
	return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: null }
}
async function doorProcessBelow(door) {
	let response = {}
	try {
		let { Sticker, runTests, defined, log, look } = await loadIcarus()

		let {warm, provider, service, address, message} = door.body

		if (warm) {
			await warmMessage(provider, service)
		} else {
			response.result = await sendMessage(provider, service, address, message)
		}

	} catch (e) { response.error = e.stack }
	return response
}


















/*
this api endpoint, based on body parameters, let's you warm or send messages four ways
also, it requires post, and doesn't allow get; see how you do that in door
*/









