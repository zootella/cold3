
import {
log, look, toss, Tag, checkTag, checkText,
doorWorker, getAccess,
secureSameText, checkAction, checkPhone,
demonstrationSignGet, validateEmailOrPhone,
fetch23,
Code, codeSend, codeEnter,
checkNumerals,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Send.', 'Enter.'], workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let r = {}

	//first, validate what the untrusted client told us
	checkTag(body.browserTag)

	if (action == 'Send.') {

		checkText(body.address)
		checkText(body.provider)

		let v = validateEmailOrPhone(body.address)
		if (!v.isValid) toss('bad address', {body, v})

		let provider = body.provider.trim().toUpperCase().slice(0, 1)
		if      (provider == 'A') provider = 'Amazon.'
		else if (provider == 'T') provider = 'Twilio.'
		else toss('bad provider', {body, provider})//ttd march, how does this get back to the page? so it can get the message bad provider, rather than just a blank 500? but not the watch, of course! some design to do here

		r.didSend = await codeSend({
			browserTag: body.browserTag,
			provider: provider,
			type: v.type,
			v: v,
		})

	} else if (action == 'Enter.') {

		checkTag(body.codeTag)
		checkNumerals(body.codeEntered)

		r.didEnter = await codeEnter({
			browserTag: body.browserTag,
			codeTag: body.codeTag,
			codeEntered: body.codeEntered,
		})
	}

	r.message = 'api code, version 2025mar18a'
	r.note = 'none'
	return r
}
