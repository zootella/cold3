
import {
Sticker, stickerParts, doorLambda, toss, log, look, defined, Task,
runTests, runTestsSticker,
} from 'icarus'//remember the automatic nuxt icarus imports aren't here on the lambda side

import {
sendMessage, warm,
} from '../persephone/persephone.js'

export const handler = async (lambdaEvent, lambdaContext) => {
	return await doorLambda('POST', {from: 'Worker.', actions: ['Gate.', 'Up2.', 'Up3.', 'Send.'], lambdaEvent, lambdaContext, doorHandleBelow})
}
async function doorHandleBelow({door, body, action}) {
	if (action == 'Gate.') {//report reachability to our manual CORS tests; application code doesn't use this action

		return {success: true, sticker: Sticker()}

	} else if (action == 'Up2.') {

		await warm()
		return {success: true, note: `lambda says: ${Sticker()}, up2done`}

	} else if (action == 'Up3.') {

		return {success: true, summary: (await runTestsSticker()).summary}

	} else if (action == 'Send.') {

		return await sendMessage({
			provider: body.provider,
			service: body.service,
			address: body.address,
			subjectText: body.subjectText,
			messageText: body.messageText,
			messageHtml: body.messageHtml,
		})
	}
}
