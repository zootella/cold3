
import {
checkNumerals, codeEnter, browserToCodes,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {useTurnstile: false, workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {

	//first, validate what the untrusted client told us
	checkTag(body.codeTag)
	checkNumerals(body.codeCandidate)

	let response = await codeEnter({
		browserHash,
		codeTag: body.codeTag,
		codeCandidate: body.codeCandidate,
	})
	response.codes = await browserToCodes({browserHash})
	return response
}
