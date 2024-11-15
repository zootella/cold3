
const { loadIcarus, warmAmazonEmail, warmAmazonTexts, warmTwilio, warmSendgrid } = require('../persephone/persephone.js');

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
		let { Sticker, runTests, defined } = await loadIcarus()

		response.message = 'hi from net23 snippet2, using door and require!'
		response.sticker = Sticker().all
		response.version = defined(process) ? process.version : 'process not defined'
		response.tests = (await runTests()).message
		response.body = {...door.body, b3: 'in the network 23 lambda at message, added this third thing'}


		/*
		then add something to body like warm: 'ae', ae, at, te, tt
		*/

	} catch (e) { response.error = e.stack }
	return response
}







/*
this api endpoint, based on body parameters, let's you warm or send messages four ways
also, it requires post, and doesn't allow get; see how you do that in door
*/









