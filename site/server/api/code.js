
import {
log, look, toss, Tag, checkTag, checkText,
doorWorker, getAccess,
secureSameText, checkAction, checkPhone,
demonstrationSignGet, validateEmailOrPhone,
fetch23,
codePermit, codeCompose, codeSent,
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

	//look up the user tag
	let userTag = (await demonstrationSignGet({browserTag: body.browserTag}))?.userTag

	let provider = body.provider.trim().toUpperCase().slice(0, 1)

	if      (provider == 'A') provider = 'Amazon.'
	else if (provider == 'T') provider = 'Twilio.'
	else toss('bad provider', {body, provider})//ttd march, how does this get back to the page? so it can get the message bad provider, rather than just a blank 500? but not the watch, of course! some design to do here




	let permit = await codePermit({addressNormal: v.formNormal})
	if (!permit.isPermitted) {
		r.permit = permit
		return r
	}

	let code = await codeCompose({permit, v, provider})

	let net23 = await fetch23({$fetch, path: '/message', body: {
		provider: code.provider,
		service: code.service,
		address: code.address,
		subjectText: code.subjectText,//email subject
		messageText: code.messageText,//email body as text, or complete SMS message
		messageHtml: code.messageHtml,//email body as HTML
	}})
	log(look({net23}))
	//does this throw if it's not successful? does it return a note in the return object?

	await codeSent({code, permit, browserTag: body.browserTag, provider, type: v.type, v})





	r.message = 'api code, version 2025mar18a'
	r.note = 'none'
	return r
}
