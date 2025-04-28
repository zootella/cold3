
import {
Sticker, doorLambda, toss, log, look, defined,
makePlain, makeObject, makeText,
Task, host23, fetchWorker, fetchLambda, fetchProvider,
runTests, runTestsSticker,
} from 'icarus'

export const handler = async (lambdaEvent, lambdaContext) => {
	return await doorLambda('POST', {lambdaEvent, lambdaContext, doorHandleBelow})
}
async function doorHandleBelow({door, body}) {

	return await warm({provider: body.provider, service: body.service})

	return {
		success: true,
		note: `lambda says: ${Sticker().all}, ping5done`,
	}
}
