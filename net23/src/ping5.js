
import {
Sticker, doorLambda, log, look,
} from 'icarus'

export const handler = async (lambdaEvent, lambdaContext) => {
	return await doorLambda('POST', {lambdaEvent, lambdaContext, doorHandleBelow})
}
async function doorHandleBelow({door, body}) {
	return {note: `lambda says: ${Sticker().all}, ping5done`}
}
