
import {
Sticker, doorLambda,
} from 'icarus'

export const handler = async (lambdaEvent, lambdaContext) => {
	return doorLambda('GET', {lambdaEvent, lambdaContext, doorProcessBelow})
}
async function doorProcessBelow(door) {
	let o = {}
	o.name = 'rgl'
	o.sticker = Sticker().all
	o.method = door.lambdaEvent.httpMethod
	o.headers = door.lambdaEvent.headers
	return o
}
