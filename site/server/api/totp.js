//./server/api/otp.js
import {
totpEnroll, totpSecretIdentifier, totpValidate, totpGenerate, otp_guard_wrong_guesses, otp_guard_horizon,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {useTurnstile: true, actions: [
		'Enroll1.',//first step of enrollment flow, we give the page what it needs to create the second factor
		'Enroll2.',//second step of enrollment flow, we validate the first code the user generates
		'Validate.',//later, the user is just signing in, we validate the code they entered
		'Remove.'//the user wants to remove their second factor, perhaps because they want to change it or set it up again after that
	], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {
	if (action == 'Enroll1.') {
		log('enroll 1 going to do that')

		let enrollment = await totpEnroll({label: '@_User-Name_', issuer: 'cold3.cc', addIdentifier: true})
		log(look(enrollment))
		return enrollment

	} else {
		log('some other action')
	}

/*
otp todo list
[x]hook up to the qr code and test in popular ios and android authenticator apps
[]test the client side redirect if we're on mobile, do that the same way as oauth, probably, ask Claude
[]store secret temporarily for user before they validate to confirm their enrollment
[]add rate limiting using trail table and the strong and usable presets you spent all day on
*/

	log('hi from the totp worker')

	return {
		sticker: Sticker(),
	}
}
