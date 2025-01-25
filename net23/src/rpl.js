

import {
Sticker, isLocal, isCloud, log, look, urlNetwork23,
Now, Tag, getAccess, checkText,
doorLambda,
} from 'icarus'

export const handler = async (lambdaEvent, lambdaContext) => {
	return doorLambda('POST', {lambdaEvent, lambdaContext, doorProcessBelow})
}
async function doorProcessBelow(door) {
	let o = {}
	o.name = 'rpl'
	o.sticker = Sticker().all
	o.method = door.lambdaEvent.httpMethod
	o.headers = door.lambdaEvent.headers
	return o
}
