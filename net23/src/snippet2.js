
const { loadGrand, requireModules } = require('../persephone/persephone.js');

exports.handler = async (lambdaEvent, lambdaContext) => {
	try {
		let { doorLambda } = await loadGrand()
		return doorLambda({lambdaEvent, lambdaContext, doorProcessBelow})
	} catch (e) { console.error('[OUTER]', e) }
	return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: null }
}
async function doorProcessBelow(door) {
	let response = {}
	try {
		let { Sticker, runTests, defined } = await loadGrand()

		response.message = 'hi from net23 snippet2, using door and require!'
		response.sticker = Sticker().all
		response.version = defined(process) ? process.version : 'process not defined'
		response.tests = (await runTests()).message
		response.modules = await requireModules()

	} catch (e) { response.error = e.stack }
	return response
}
