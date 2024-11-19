
import { log, look, Now, Tag, Data, Sticker, doorLambda } from 'icarus';
import { snippet } from '../persephone/persephone.js';

export default async function handler (lambdaEvent, lambdaContext) {
	try {
		return doorLambda({lambdaEvent, lambdaContext, doorProcessBelow})
	} catch (e) { console.error('[OUTER]', e) }
	return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: null }
}
async function doorProcessBelow(door) {
	let o = {}

//	await snippetBelow()
	o.note = `lambda snippet3 says: ${Sticker().all}`

	return o
}







