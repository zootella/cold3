
import {
log, look, Now, Tag,
Sticker, snippet,
doorLambda,
} from '../../library/grand.js'

export const handler = async (lambdaEvent, lambdaContext) => {
	return doorLambda({lambdaEvent, lambdaContext, doorProcessBelow})
}
async function doorProcessBelow(door) {
	let o = {}

	o.note = `lambda snippet2 says: ${Sticker().all}`

	return o
}
