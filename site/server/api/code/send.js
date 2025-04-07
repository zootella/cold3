
import {
log, look, toss, Tag, checkTag, checkText,
doorWorker, getAccess,
secureSameText, checkPhone,
demonstrationSignGet, validateEmailOrPhone,
Code, codeSend, codeEnter, browserToCodes,
checkNumerals,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {useTurnstile: true, workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {

	//first, validate what the untrusted client told us
	checkTag(body.browserTag)

	checkText(body.address)
	checkText(body.provider)

	let v = validateEmailOrPhone(body.address)
	if (!v.isValid) toss('bad address', {body, v})

	let provider = body.provider.trim().toUpperCase().slice(0, 1)
	if      (provider == 'A') provider = 'Amazon.'
	else if (provider == 'T') provider = 'Twilio.'
	else toss('bad provider', {body, provider})//ttd march, how does this get back to the page? so it can get the message bad provider, rather than just a blank 500? but not the watch, of course! some design to do here

	return await codeSend({
		browserTag: body.browserTag,
		provider: provider,
		type: v.type,
		v: v,
	})
}
