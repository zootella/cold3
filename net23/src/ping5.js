
const { loadGrand } = require('../persephone/persephone.js');

exports.handler = async (lambdaEvent, lambdaContext) => {
	let note = ''
	try {
		let { Sticker } = await loadGrand()

		note = `lambda says: ${Sticker().all}, ping5done`

	} catch (e) { note = 'ping5 lambda error: '+e.stack }
	return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({note}) }
}
