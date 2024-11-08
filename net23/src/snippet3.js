
const { loadIcarus } = require('../persephone/persephone.js');

exports.handler = async (lambdaEvent, lambdaContext) => {
	try {
		let { doorLambda } = await loadIcarus()
		return doorLambda({lambdaEvent, lambdaContext, doorProcessBelow})
	} catch (e) { console.error('[OUTER]', e) }
	return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: null }
}
async function doorProcessBelow(door) {
	let o = {}
	let {
		log, look, Now, Tag, Data,
		Sticker, snippet,
		doorLambda,
	} = await loadIcarus()

//	await snippetBelow()
	o.note = `lambda snippet3 says: ${Sticker().all}`

	return o
}







