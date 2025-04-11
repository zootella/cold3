
import {
checkNumerals, codeEnter,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {useTurnstile: false, workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	log('hi in api enter', look({body}))

	//first, validate what the untrusted client told us
	checkTag(body.browserTag)
	checkTag(body.codeTag)
	checkNumerals(body.codeCandidate)

	return await codeEnter({
		browserTag: body.browserTag,
		codeTag: body.codeTag,
		codeCandidate: body.codeCandidate,
	})
}
