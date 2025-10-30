
import {
validateEmailOrPhone, codeSend, browserToCodes,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {useTurnstile: true, workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, browserHash}) {

	//first, validate what the untrusted client told us
	checkText(body.address)
	checkText(body.provider)

	let v = validateEmailOrPhone(body.address)
	if (!v.ok) toss('bad address', {body, v})

	let provider = body.provider.trim().toUpperCase().slice(0, 1)
	if      (provider == 'A') provider = 'Amazon.'
	else if (provider == 'T') provider = 'Twilio.'
	else toss('bad provider', {body, provider})//ttd march, how does this get back to the page? so it can get the message bad provider, rather than just a blank 500? but not the watch, of course! some design to do here

	let response = await codeSend({
		browserHash,
		provider: provider,
		type: v.type,
		v: v,
	})
	response.codes = await browserToCodes({browserHash})
	return response
}
