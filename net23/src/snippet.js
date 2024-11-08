
const { loadIcarus } = require('../persephone/persephone.js');

exports.handler = async (lambdaEvent, lambdaContext) => {
	let o = {}
	try {
		let { Sticker, snippet } = await loadIcarus()

		o.note = `lambda snippet says: ${Sticker().all}, v2024oct21c`
		o.look = await snippet()

	} catch (e) { o.error = 'snippet lambda error: '+e.stack }
	return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o) }
}
