
import {
Sticker, stickerParts, doorLambda, toss, log, look, defined, Task,
} from 'icarus'

export const handler = async (lambdaEvent, lambdaContext) => {
	return await doorLambda('GET', {lambdaEvent, lambdaContext, doorHandleBelow})
}
async function doorHandleBelow({door, body}) {
	let o = {}
	o.name = 'GateGetLambda.'
	o.sticker = Sticker()
	o.method = door.lambdaEvent.httpMethod
	o.headers = door.lambdaEvent.headers
	o.success = true
	return o
}
