
import {
Sticker, doorLambda, toss, log, look, defined,
makePlain, makeObject, makeText,
Task, host23, fetchWorker, fetchLambda, fetchProvider,
} from 'icarus'

export const handler = async (lambdaEvent, lambdaContext) => {
	return await doorLambda('POST', {lambdaEvent, lambdaContext, doorHandleBelow})
}
async function doorHandleBelow({door, body}) {
	let o = {}
	o.name = 'GatePostLambda.'
	o.sticker = Sticker().all
	o.method = door.lambdaEvent.httpMethod
	o.headers = door.lambdaEvent.headers
	o.success = true
	return o
}
