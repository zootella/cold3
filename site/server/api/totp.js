//./server/api/totp.js
import {
browserToUser, trailAdd, trailCount,
checkNumerals, Data, encryptData, decryptData,
totpEnroll, totpSecretIdentifier, totpValidate, totpGenerate, totpConstants, checkTotpSecret, checkTotpCode,
credentialTotpGet, credentialTotpCreate, credentialTotpRemove,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Status.', 'Enroll1.', 'Enroll2.', 'Validate.', 'Remove.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {

	//collect information from the database
	let user, userTag, secret
	user = await browserToUser({browserHash})//what user is signed in at the browser talking to us
	if (user) { userTag = user.userTag; checkTag(userTag) }
	if (userTag) secret = await credentialTotpGet({userTag})//and does that user have totp
	if (secret) checkTotpSecret(secret)

	//status check on component load
	if (action == 'Status.') {
		if (user.level < 2) return {outcome: 'StatusNoUser.'}
		if (secret) return {outcome: 'StatusEnrolled.'}
		return {outcome: 'StatusNotEnrolled.'}
	}

	//get the key we the server use to protect provisional totp secrets while, during enrollment, the page has them in temporary cookies
	const access = await getAccess()
	let keyData = Data({base62: access.get('ACCESS_TOTP_SECRET')})

	//make sure there's a user signed in (first factor) to the browser that posted at us
	if (user.level < 2) return {outcome: 'BadUser.'}
	checkTag(userTag)

	if (action == 'Enroll1.' || action == 'Enroll2.') { if (secret) return {outcome: 'BadAlreadyEnrolled.'} }
	else if (action == 'Validate.' || action == 'Remove.') { if (!secret) return {outcome: 'BadNotEnrolled.'} }//ttd november, once in place, these should probably be toss 500 rather than return bad, unlike the plausible bad flows below which are correct to return rather than throw

	if (action == 'Enroll2.' || action == 'Validate.') checkTotpCode(body.code)

	//first step of enrollment flow; the user at browser wants to setup totp as a second factor
	//here at the server, we make sure they're not already enrolled, and generate a new random secret for the qr code
	if (action == 'Enroll1.') {

		let enrollment = await totpEnroll({//make a new provisional enrollment; this generates enrollment.secret
			label: '@'+user.name.f1,//ttd november, simplified for demo
			issuer: Key('totp, issuer, public, page'),
			addIdentifier: true,
			keyData,
		})
		enrollment.secretCipher62 = (await encryptData(keyData, Data({base32: enrollment.secret}))).base62()

		await trailAdd(
			`TOTP Provisional Enrollment for User ${userTag} at Browser ${browserHash} given Secret ${enrollment.secret}`
		)
		return {outcome: 'Candidate.', enrollment}

	//second step of enrollment flow; the user has scanned the qr code and knows the current code
	//we make sure the code is correct, and create their enrollment
	} else if (action == 'Enroll2.') {

		//decrypt the secret from the page, possibly via a cookie through a refresh
		secret = (await decryptData(keyData, Data({base62: body.secretCipher62}))).base32()
		checkTotpSecret(secret)

		//make sure the page has given us back the same real valid secret we gave it in enrollment step 1 above
		let n = await trailCount(
			`TOTP Provisional Enrollment for User ${userTag} at Browser ${browserHash} given Secret ${secret}`,
			totpConstants.enrollmentExpiration
		)
		if (n != 1) return {outcome: 'BadSecret.'}//➡️ passing this check is proof it's the real secret from step 1!

		//make sure the user can generate a valid code
		let valid = await totpValidate(Data({base32: secret}), body.code)
		if (!valid) return {outcome: 'BadCode.'}//rate limiting not necessary during enrollment; the page still has the secret at this point!

		//save this new enrollment for this user
		await credentialTotpCreate({userTag, secret})
		return {outcome: 'Enrolled.'}

	//having previously enrolled, the user is signing in with totp
	//here on the server, we validate the code
	} else if (action == 'Validate.') {

		//protect guesses on this secret from a brute force attack, which would succeed quickly
		let n = await trailCount(
			`TOTP wrong guess on Secret ${secret}`,
			totpConstants.guardHorizon
		)
		if (n >= totpConstants.guardWrongGuesses) return {outcome: 'Later.'}

		//validate the page's guess
		let valid = await totpValidate(secret, body.code)
		if (valid) {//guess at code from page is correct

			log(`ttd november 🎃 user ${userTag} validated a code correctly, so we can let them in or sudo a transaction or something`)
			await trailAdd(
				`TOTP validation on Secret ${secret}`//we can use this to detect if a user has a totp they haven't used in months, and maybe lost
			)
			return {outcome: 'Correct.'}

		} else {//guess at code from page is wrong

			await trailAdd(
				`TOTP wrong guess on Secret ${secret}`
			)
			return {outcome: 'Wrong.'}
		}

	//an enrolled user wants to remove their totp enrollment, likely to setup a different one
	//right now we make this available without additional verification, ttd november
	} else if (action == 'Remove.') {

		await credentialTotpRemove({userTag})
		return {outcome: 'Removed.'}
	}
}








