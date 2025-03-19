
import {
log, look, toss, Tag, checkTag, checkText,
doorWorker, getAccess,
secureSameText, checkAction, checkPhone,
demonstrationSignGet, validateEmailOrPhone,
fetch23,
codeSend, codeEnter,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let r = {}

	//first, validate what the untrusted client told us
	checkTag(body.browserTag)
	checkText(body.address)
	checkText(body.provider)
	checkAction(action, ['Send.', 'Enter.'])//list of acceptable actions

	let v = validateEmailOrPhone(body.address)
	if (!v.isValid) toss('bad address', {body, v})

	let provider = body.provider.trim().toUpperCase().slice(0, 1)
	if      (provider == 'A') provider = 'Amazon.'
	else if (provider == 'T') provider = 'Twilio.'
	else toss('bad provider', {body, provider})//ttd march, how does this get back to the page? so it can get the message bad provider, rather than just a blank 500? but not the watch, of course! some design to do here

	if (action == 'Send.') {

		r.didSend = await codeSend({
			browserTag: body.browserTag,
			provider: provider,
			type: v.type,
			v: v,
		})

	} else if (action == 'Enter.') {

		r.didEnter = await codeEnter({})

	} else { toss('action') }




	r.message = 'api code, version 2025mar18a'
	r.note = 'none'
	return r
}




















