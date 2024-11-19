import { Sticker } from 'icarus';
import { snippet } from '../persephone/persephone.js';

export default async function handler (lambdaEvent, lambdaContext) {
	let o = {}
	try {
		o.note = `lambda snippet says: ${Sticker().all}, v2024oct21c`
		o.look = await snippet()

	} catch (e) { o.error = 'snippet lambda error: '+e.stack }
	return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o) }
}
