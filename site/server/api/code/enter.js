
import {
log, look, toss, Tag, checkTag, checkText,
doorWorker, getAccess,
secureSameText, checkPhone,
demonstrationSignGet, validateEmailOrPhone,
Code, codeSend, codeEnter,
checkNumerals,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {useTurnstile: false, workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let r = {}

	//first, validate what the untrusted client told us
	checkTag(body.browserTag)
	checkTag(body.codeTag)
	checkNumerals(body.codeEntered)

	r.didEnter = await codeEnter({
		browserTag: body.browserTag,
		codeTag: body.codeTag,
		codeEntered: body.codeEntered,
	})
	/*
	ttd april,  maybe it's:
	result - the page's view of the fetch that happened
	response - in there, the body the server sent back to us
	records - in there, the records with .tick and .tag for a list in pinia
	*/

	r.message = 'api code, version 2025mar18a'
	r.note = 'none'
	return r
}
