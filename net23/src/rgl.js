
import {
Sticker, doorLambda, log, look, defined,
makePlain, makeObject, makeText,
Task, fetchWorker, fetchLambda, fetchProvider,
host23, fetchWorker_new, fetchLambda_new, fetchProvider_new,
} from 'icarus'

export const handler = async (lambdaEvent, lambdaContext) => {
	return await doorLambda('GET', {lambdaEvent, lambdaContext, doorHandleBelow})
}
async function doorHandleBelow({door, body}) {
	let o = {}
	o.name = 'rgl'
	o.sticker = Sticker().all
	o.method = door.lambdaEvent.httpMethod
	o.headers = door.lambdaEvent.headers
	return o
}
