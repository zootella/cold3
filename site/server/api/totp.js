//./server/api/totp.js
import {
browserToUser, trailAdd, hashText,
totpEnroll, totpSecretIdentifier, totpValidate, totpGenerate, totpConstants,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {useTurnstile: false, actions: [//ttd november, confirm that turnstile is not necessary here, as secrets are too long to guess even at full speed
		'Enroll1.',//first step of enrollment flow, we give the page what it needs to create the second factor
		'Enroll2.',//second step of enrollment flow, we validate the first code the user generates
		'Validate.',//later, the user is just signing in, we validate the code they entered
		'Remove.',//the user wants to remove their second factor, perhaps because they want to change it or set it up again after that
	], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {

	return {isEnrolled: false, reason: 'not implemented yet, ttd november'}//throwing so doing nothing for this deploy, ttd november

	let user = await browserToUser({browserHash})
	log(look(user))
	checkTag(user.userTag)

	//first step in an endpoint, validate that the page told us what's required and it looks well formed, at least
	if (action == 'Enroll1.') {
		//page doesn't send any additional details in enrollment step 1

	} else if (action == 'Enroll2.') {
		//to validate a provisional enrollment, page must echo back the same secret we chose for it, and the current code

		if (Data({base32: body.secret}).size != 20) toss('body')//20 byte totp secret in base32
		if (body.code.length != 6) toss('body')//6 numeral totp code, a string, can start zero
		checkNumerals(body.code)

	} else if (action == 'Validate2.') {
	} else if (action == 'Remove2.') {
	}
	//with sanity check validation done, on to the work of the endpoint

	if (action == 'Enroll1.') {
		//ttd november, ok, but need to add now, is this user already enrolled?

		//create a new provisional enrollment for this user, this creates enrollment.secret
		let enrollment = await totpEnroll({
			label: '@'+user.name.f1,//ttd november, simplified for demo
			issuer: Key('totp, issuer, public, page'),
			addIdentifier: true,
		})
		await trailAdd({hash: totpHashEnrollment({browserHash: browserHash, userTag: user.userTag, secret: enrollment.secret})})
		log(look(enrollment))
		return {isEnrolled: false, provisionalEnrollment: enrollment}

	} else if (action == 'Enroll2.') {

		let found = await trailGet({
			hash: totpHashEnrollment({browserHash: browserHash, userTag: user.userTag, secret: body.secret}),
			since: Now() - (20*Time.minute),
		})//ttd november, 20 bytes and 20 minutes should probably be defined in level 0 with the cryptography, or something?
		if (found != 1) return {isEnrolled: false, reason: 'BadSecret.'}//the page needs to echo back the same secret we told made for it in enrollment step 1; if we can't find it, it is either expired or worse, tampered with or fictitious

		let valid = totpValidate(body.secret, body.code)
		if (!valid) return {isEnrolled: false, reason: 'BadCode.'}

		//here's where you actually need to associate the validated enrollment with the user, in authenticate_table or whatever, which you can actually make right now

		return {isEnrolled: true}

	} else if (action == 'Validate.') {
	} else if (action == 'Remove.') {
		//ttd november, should the remove flow require second factor validation? maybe, but not at this level

	}

/*
ttd august2025, things to actually implement totp
[x]hook up to the qr code and test in popular ios and android authenticator apps
[]test the client side redirect if we're on mobile, do that the same way as oauth, probably, ask Claude
[]store secret temporarily for user before they validate to confirm their enrollment
[]add rate limiting using trail table and the strong and usable presets you spent all day on
*/


	return {
		sticker: Sticker(),
	}
}



async function totpValidateRateLimit(secret, code) {
	//is this totp secret too hot for another guess right now?
	/*

	let wrongGuesses = await trailCount({hash: , since: Now() - ())


	let valid = await totpValidate(secret, code)
	if (valid)
	*/

}


async function totpHashEnrollment({browserHash, userTag, secret}) {
	let message = `totp provisional enrollment for user tag ${userTag} at browser hash ${browserHash} generated secret base 32 ${secret}`
	log(message)
	return await hashText(message)
}
async function totpHashWrongGuess({secret}) {
	let message = `totp wrong guess on secret base 32 ${secret}`
	log(message)
	return await hashText(message)
}












