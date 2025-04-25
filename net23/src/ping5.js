
import {
Sticker, doorLambda, tossTest, tossTask, toss, log, look, defined,
makePlain, makeObject, makeText,
Task, fetchWorker_old, fetchLambda_old, fetchProvider_old,
host23, fetchWorker, fetchLambda, fetchProvider,
} from 'icarus'

export const handler = async (lambdaEvent, lambdaContext) => {
	return await doorLambda('POST', {lambdaEvent, lambdaContext, doorHandleBelow})
}
async function doorHandleBelow({door, body}) {
	return {note: `lambda says: ${Sticker().all}, ping5done`}
}
