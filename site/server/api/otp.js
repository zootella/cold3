//./server/api/otp.js
import {
} from 'icarus'
import {Secret, TOTP} from 'otpauth'//importing here, not in icarus, as only a nuxt server endpoint needs otpauth, ttd august

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {useTurnstile: true, actions: ['Create1.', 'Create2.', 'Validate.', 'Remove.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body}) {

	/*
// Server: Generate secret
const secret = Secret.fromRandom()
const totp = new TOTP({ secret, label: 'user@email', issuer: 'YourApp' })
const uri = totp.toString() // Creates otpauth:// URI

// Server: Verify setup code
const isValid = totp.validate({ token: userEnteredCode, window: 1 })


// Server: Validate login code
const secret = Secret.fromBase32(storedUserSecret)
const totp = new TOTP({ secret })
const isValid = totp.validate({ token: userEnteredCode, window: 1 })

	*/

	return {
		sticker: Sticker(),
		looked: look({Secret, TOTP}),
	}
}
