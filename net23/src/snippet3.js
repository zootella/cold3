
import {
Sticker, doorLambda,
} from 'icarus'

export const handler = async (lambdaEvent, lambdaContext) => {
	try {
		return doorLambda({lambdaEvent, lambdaContext, doorProcessBelow})
	} catch (e) { console.error('[OUTER]', e) }
	return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: null }
}
async function doorProcessBelow(door) {
	let o = {}

	o.note = `lambda snippet3 says: ${Sticker().all}`

	return o
}







