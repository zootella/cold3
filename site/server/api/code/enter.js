
import {
checkNumerals, codeEnter, browserToCodes,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {useTurnstile: false, workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {

	//first, validate what the untrusted client told us
	checkTag(body.browserTag)
	checkTag(body.codeTag)
	checkNumerals(body.codeCandidate)

	let response = await codeEnter({
		browserTag: body.browserTag,
		codeTag: body.codeTag,
		codeCandidate: body.codeCandidate,
	})
	response.codes = await browserToCodes({browserTag})
	return response
}
