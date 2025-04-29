
import {
Sticker, doorLambda, toss, log, look, defined,

} from 'icarus'

import {
warm,
} from '../persephone/persephone.js'

export const handler = async (lambdaEvent, lambdaContext) => {
	return await doorLambda('POST', {lambdaEvent, lambdaContext, doorHandleBelow})
}
async function doorHandleBelow({door, body}) {
	await warm({})
	return {
		success: true,
		note: `lambda says: ${Sticker().all}, up2done`,
	}
}
