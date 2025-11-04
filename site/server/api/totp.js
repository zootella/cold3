//./server/api/totp.js
import {
browserToUser, trailAdd, trailCount,
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

	//this only works if there's a user signed in at this browser, ttd november
	const userTag = (await browserToUser({browserHash})).userTag; checkTag(userTag)



	//first step in an endpoint, validate that the page told us what's required and it looks well formed, at least
	if (action == 'Enroll1.') {
		//page doesn't send any additional details in enrollment step 1

	} else if (action == 'Enroll2.') {
		//to validate a provisional enrollment, page must echo back the same secret we chose for it, and the current code

		if (Data({base32: body.secret}).size != totpConstants.secretSize) toss('body')//20 byte totp secret in base32
		checkNumerals(body.code); if (body.code.length != totpConstants.codeLength) toss('body')//6 numeral totp code, a string, can start zero

	} else if (action == 'Validate2.') {
		//to authenticate a code, the page sends the code; we already know the secret for this uer, and must keep it secret

		checkNumerals(body.code); if (body.code.length != totpConstants.codeLength) toss('body')//6 numeral totp code, a string, can start zero

	} else if (action == 'Remove2.') {
		//right now removing an enrollment is available to the idenified user without an additional step here, ttd november
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
		await trailAdd(composeTrailEnrollment({browserHash, userTag, secret: enrollment.secret}))
		return {outcome: 'Candidate.', provisionalEnrollment: enrollment}

	} else if (action == 'Enroll2.') {

		let n = await trailCount(composeTrailEnrollment({browserHash, userTag, secret: body.secret}), totpConstants.enrollmentExpiration)
		if (n != 1) return {outcome: 'BadSecret.'}//expired provisional enrollment secret, the user should start a new enrollment
		//➡️ here at the server, making it here is proof the page did not create or tamper with the secret during enrollment

		let valid = await totpValidate(body.secret, body.code)
		if (!valid) return {outcome: 'BadCode.'}//incorrect code during enrollment, the user can guess again as many times as they want, actually

		//here's where you actually need to associate the validated enrollment with the user, in authenticate_table or whatever, which you can actually make right now
		await authenticateStepPlaceholder()
		return {outcome: 'Enrolled.'}

	} else if (action == 'Validate.') {

		//look up this user's totp secret, they will have one if enrolled
		await secret = await totpUserToSecret(userTag)
		if (!secret) toss('totp secret not found to validate a code', {userTag})//very unusual, so we throw to stop the server and break the page

		//protect guesses on this secret from a brute force attack, which would succeed quickly
		let n = await trailCount(composeTrailWrongGuess({secret}), totpConstants.guardHorizon)
		if (n >= totpConstants.guardWrongGuesses) return {outcome: 'Later.'}

		//validate the page's guess
		let valid = await totpValidate(secret, body.code)
		if (valid) {

			//correct, make a note on the server (ttd november), and tell the page
			await authenticateStepPlaceholder()
			return {outcome: 'Correct.'}

		} else {

			//or, wrong guess, make a note in the trail, and tell the page
			await trailAdd(composeTrailWrongGuess({secret}))
			return {outcome: 'Wrong.'}
		}

	} else if (action == 'Remove.') {
		//ttd november, should the remove flow require second factor validation? maybe, but not at this level

		//look up this user's totp secret, they will have one if enrolled
		await secret = await totpUserToSecret(userTag)
		if (!secret) toss('totp secret not found to remove enrollment', {userTag})

		return {outcome: 'Removed.'}
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


async function authenticateStepPlaceholder() {

}



async function totpValidateRateLimit(secret, code) {
	//is this totp secret too hot for another guess right now?
	/*

	let wrongGuesses = await trailCount(message, horizon)


	let valid = await totpValidate(secret, code)
	if (valid)
	*/

}


function composeTrailEnrollment({browserHash, userTag, secret}) {
	return `totp provisional enrollment for user tag ${userTag} at browser hash ${browserHash} generated secret base 32 ${secret}`
}
async function composeTrailWrongGuess({secret}) {
	return `totp wrong guess on secret base 32 ${secret}`
}
