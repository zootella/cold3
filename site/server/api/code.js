
import {
log, look, toss, Tag, checkTag, checkText,
doorWorker, getAccess,
secureSameText, checkAction, checkPhone,
demonstrationSignGet, validateEmailOrPhone,
codeCompose, fetch23, composeEmail,
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

	//first, just send a code, to do this runthrough outer to inner
	const access = await getAccess()
	let brand = access.get('ACCESS_MESSAGE_BRAND')
	let service = v.type

	let c = await codeCompose()
	let s = `Code ${c.letter}-${c.code} from ${brand}.`
	let e = composeEmail({pink: s, gray: ` Don't tell anyone, they could steal your whole account!`})

	let net23 = await fetch23({$fetch, path: '/message', body: {
		provider,
		service,
		address: v.formFormal,
		subjectText: s,//email subject
		messageText: e.messageText,//email body as text, or complete SMS message
		messageHtml: e.messageHtml,//email body as HTML
	}})

	log(look({
		net23,
	}))

	r.message = 'api code, version 2025mar18a'
	r.note = 'none'
	return r
}
