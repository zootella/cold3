
import {
Sticker, doorLambda,
} from 'icarus'

export const handler = async (lambdaEvent, lambdaContext) => {
	return doorLambda('POST', {lambdaEvent, lambdaContext, doorHandleBelow})
}
async function doorHandleBelow({door, body, action}) {
	return {note: `lambda says: ${Sticker().all}, ping5done`}
}
