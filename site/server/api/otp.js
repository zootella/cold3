//./server/api/otp.js
import {
validateEmailOrPhone,
isExpired,
Code,
otpSend, otpEnter,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['FoundEnvelope.', 'SendTurnstile.', 'Enter.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {

	//send a verification code to an email or phone
	if (action == 'SendTurnstile.') {

		//first, validate what the untrusted client told us
		checkText(body.address)
		checkText(body.provider)

		let v = validateEmailOrPhone(body.address)
		if (!v.ok) return {success: false, reason: 'BadAddress.'}

		let provider = body.provider.trim().toUpperCase().slice(0, 1)
		if      (provider == 'A') provider = 'Amazon.'
		else if (provider == 'T') provider = 'Twilio.'
		else return {success: false, reason: 'BadProvider.'}

		return await otpSend({browserHash, provider, type: v.type, v, envelope: body.envelope})

	//page found an envelope cookie and wants to know what challenges exist
	} else if (action == 'FoundEnvelope.') {

		//no envelope, return empty
		if (!hasText(body.envelope)) return {envelope: null, otps: []}

		//open envelope (bad envelope throws, becomes 500)
		let letter = await openEnvelope('Otp.', body.envelope, {skipExpirationCheck: true})

		//wrong browser is suspicious, toss
		if (letter.browserHash !== browserHash) toss('wrong browser')

		//expired envelope, return empty
		if (isExpired(letter.expiration)) return {envelope: null, otps: []}

		//filter out expired challenges
		let challenges = (letter.challenges || []).filter(c => Now() <= c.start + Code.expiration)

		//re-seal with only valid challenges (or null if none remain)
		let envelope = challenges.length ? await sealEnvelope('Otp.', Limit.expirationUser, {browserHash, challenges}) : null

		//return challenges without codes for display
		let otps = challenges.map(c => ({
			tag: c.tag,
			letter: c.letter,
			lives: c.lives,
			start: c.start,
			address: c.address,
			addressType: c.addressType,
		}))

		return {envelope, otps}

	//user is entering a code guess
	} else if (action == 'Enter.') {

		//first, validate what the untrusted client told us
		checkText(body.envelope)
		checkTag(body.otpTag)
		checkText(body.otpCandidate)

		return await otpEnter({browserHash, envelope: body.envelope, otpTag: body.otpTag, otpCandidate: body.otpCandidate})
	}
}
