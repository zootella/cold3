
import {
validateEmailOrPhone,
otpConstants,
otpSend, otpEnter,
checkNumerals,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['FoundEnvelope.', 'SendTurnstile.', 'Enter.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {

	let letter//letter contains this browser's active code challenges, and gets passed cookie <--> page <--> server and down the stack
	if (hasText(body.envelope)) {
		letter = await openEnvelope('Otp.', body.envelope, {browserHash, skipExpirationCheck: true})//envelope must be authentic and browser hash must match; we skip the envelope expiration check because an old envelope can't contain young codes, and we filter old codes out next
	} else {
		letter = {otps: []}//no challenges from earlier, but make an empty array in case we add one
	}
	letter.otps = letter.otps.filter(o => Now() <= o.start + otpConstants.expiration)//filter to only keep not yet expired challenges

	let response//each action below sets this response reference, which we return as the response body
	if (action == 'SendTurnstile.') {//the person at the page has entered their email or phone to get a code there; this action needs turnstile protection to prevent a script kiddie from hitting here to spam strangers or run up our amazon or twilio bill 💩💸

		let {address, provider} = body
		checkText(address); checkText(provider)
		let v = validateEmailOrPhone(address)
		if (!v.ok) toss('form')
		provider = body.provider.trim().toUpperCase().slice(0, 1)
		if      (provider == 'A') provider = 'Amazon.'
		else if (provider == 'T') provider = 'Twilio.'
		else toss('form')//temporary to get started; the round robin system, not the page, should choose the provider, ttd january

		response = await otpSend({letter, v, provider, browserHash})

	} else if (action == 'FoundEnvelope.') {//the page found a otp cookie it can't read from less than 20 minutes ago; we'll open it and reply with the question parts of the challenges it contains for this browser, if any haven't expired yet

		response = {success: true}

	} else if (action == 'Enter.') {//the person at page has entered their guess at a code their browser knows about

		let {tag, guess} = body//tag identifes the challenge; guess is what they entered (hopefully correctly from their email or texts)
		checkTag(tag); checkNumerals(guess)
		response = await otpEnter({letter, tag, guess, browserHash})
	}

	if (letter.otps.length > 0) {//we have active challenges for this browser
		letter.browserHash = browserHash//lock this letter to the connected browser
		response.envelope = await sealEnvelope('Otp.', otpConstants.expiration, letter)//encrypt it for the browser to keep for up to 20 minutes in a cookie
	}
	response.otps = letter.otps.map(o => ({//we always return an array of non-secret information about currently active challenges
		tag: o.tag,//a tag identifies each challenge; the page will tell us which one it's guessing at
		start: o.start,//the birthdate of this challenge, which lives for 20 minutes
		address: o.address,//the full address object with ok, f0, f1, f2, and type
		//the secret code we sent, like "123456" is o.answer; it's encrypted into envelope, and critically not leaked here to the page!
	}))
	return response
}
