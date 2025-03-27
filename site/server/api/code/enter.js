
import {
log, look, toss, Tag, checkTag, checkText,
doorWorker, getAccess,
secureSameText, checkPhone,
demonstrationSignGet, validateEmailOrPhone,
fetch23,
Code, codeSend, codeEnter,
checkNumerals,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {useTurnstile: false, workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow})
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

	r.message = 'api code, version 2025mar18a'
	r.note = 'none'
	return r
}
