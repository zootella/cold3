
import {
Sticker, doorLambda, log, look, defined,
makePlain, makeObject, makeText,
Task, fetchWorker, fetchLambda, fetchProvider,
host23, fetchWorker_new, fetchLambda_new, fetchProvider_new,
} from 'icarus'

export const handler = async (lambdaEvent, lambdaContext) => {
	return await doorLambda('POST', {lambdaEvent, lambdaContext, doorHandleBelow})
}
async function doorHandleBelow({door, body}) {
	return {note: `lambda says: ${Sticker().all}, ping5done`}
}
