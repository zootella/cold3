//./server/api/otp.js
import {
otpEnroll, otpIsValid, otp_guard_wrong_guesses, otp_guard_horizon,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {useTurnstile: true, actions: [
		'Create1.',//first step of enrollment flow, we give the page what it needs to create the second factor
		'Create2.',//second step of enrollment flow, we validate the first code the user generates
		'Validate.',//later, the user is just signing in, we validate the code they entered
		'Remove.'//the user wants to remove their second factor, perhaps because they want to change it or set it up again after that
	], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {

/*
otp todo list
[]store secret temporarily for user before they validate to confirm their enrollment
[]add rate limiting using trail table and the strong and usable presets you spent all day on
*/

	log('hi from the worker, also')

	return {
		sticker: Sticker(),
		imported: look({otpEnroll, otpIsValid, otp_guard_wrong_guesses, otp_guard_horizon}),
	}
}
