
import {
Sticker, doorLambda, toss, log, look, defined,
makePlain, makeObject, makeText,
Task, host23, fetchWorker, fetchLambda, fetchProvider,
runTests, runTestsSticker,
} from 'icarus'

import {//not importing anything, but this lets tests get listed to run below
} from '../persephone/persephone.js'

export const handler = async (lambdaEvent, lambdaContext) => {
	return await doorLambda('POST', {lambdaEvent, lambdaContext, doorHandleBelow})
}
async function doorHandleBelow({door, body}) {
	return {
		success: true,
		summary: (await runTestsSticker()).summary,
	}
}
