
import {
Sticker, doorLambda,
} from 'icarus'

export const handler = async (lambdaEvent, lambdaContext) => {
	return doorLambda('POST', {lambdaEvent, lambdaContext, doorProcessBelow})
}
async function doorProcessBelow(door) {
	return {note: `lambda says: ${Sticker().all}, ping5done`}
}
