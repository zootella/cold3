
import {
Sticker, doorLambda, log, look, defined,
makePlain, makeObject, makeText,
Task, fetchWorker_old, fetchLambda_old, fetchProvider_old,
host23, fetchWorker, fetchLambda, fetchProvider,
} from 'icarus'

export const handler = async (lambdaEvent, lambdaContext) => {
	return await doorLambda('POST', {lambdaEvent, lambdaContext, doorHandleBelow})
}
async function doorHandleBelow({door, body}) {
	let o = {}
	o.name = 'rpl'
	o.sticker = Sticker().all
	o.method = door.lambdaEvent.httpMethod
	o.headers = door.lambdaEvent.headers
	return o
}
