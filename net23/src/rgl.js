

import {
Sticker, isLocal, isCloud, log, look, urlNetwork23,
Now, Tag, getAccess, checkText,
doorLambda,
} from 'icarus'

export const handler = async (lambdaEvent, lambdaContext) => {
	return await doorLambda('GET', {lambdaEvent, lambdaContext, doorHandleBelow})
}
async function doorHandleBelow({door, body, action}) {
	let o = {}
	o.name = 'rgl'
	o.sticker = Sticker().all
	o.method = door.lambdaEvent.httpMethod
	o.headers = door.lambdaEvent.headers
	return o
}
