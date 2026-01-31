
import {
Sticker, stickerParts, doorLambda, toss, log, look, defined, Task,
runTests, runTestsSticker,
} from 'icarus'

import {
warm,
} from '../persephone/persephone.js'

export const handler = async (lambdaEvent, lambdaContext) => {
	return await doorLambda('POST', {from: 'Worker.', lambdaEvent, lambdaContext, doorHandleBelow})
}
async function doorHandleBelow({door, body}) {
	await warm()
	return {
		success: true,
		note: `lambda says: ${Sticker()}, up2done`,
	}
}
