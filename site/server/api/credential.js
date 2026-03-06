
import {
hasTextSame,
validateName,
credentialBrowserGet, credentialBrowserSet, credentialBrowserRemove,
credentialNameCheck, credentialNameSet, credentialNameGet, credentialNameRemove,
credentialPasswordSet, credentialPasswordGet, credentialPasswordRemove,
credentialTotpGet, credentialTotpSet, credentialTotpRemove,
credentialWalletGet, credentialWalletSet, credentialWalletRemove,
credentialCloseAccount,
totpEnroll, totpValidate, totpIdentifier, totpConstants,
checkTotpCode, checkTotpSecret, checkWallet, Data, isExpired,
trailCount, trailAdd,
} from 'icarus'
import {verifyMessage} from 'viem'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Get.', 'SignOut.', 'CheckNameTurnstile.', 'SignUpAndSignInTurnstile.', 'GetPasswordCyclesTurnstile.', 'SignIn.', 'SetName.', 'RemoveName.', 'SetPassword.', 'RemovePassword.', 'TotpEnroll1.', 'TotpEnroll2.', 'TotpRemove.', 'TotpValidate.', 'WalletProve1.', 'WalletProve2.', 'WalletRemove.', 'CloseAccount.'], workerEvent, doorHandleBelow})
})

async function attachState(task, browserHash) {//attach complete credential state to task — every credential type, every time, so one call gives the store everything it needs to render the full credential panel
	task.browserHash = browserHash
	let user = await credentialBrowserGet({browserHash})
	if (user) {
		task.userTag = user.userTag
		let name = await credentialNameGet({userTag: user.userTag})
		if (name) task.user = name.name
		let password = await credentialPasswordGet({userTag: user.userTag})
		if (password) task.passwordCycles = password.cycles
		let totpSecret = await credentialTotpGet({userTag: user.userTag})
		if (totpSecret) {
			task.totpEnrolled = true
			task.totpIdentifier = await totpIdentifier({secret: Data({base32: totpSecret})})
		} else {
			task.totpEnrolled = false
			task.totpIdentifier = ''
		}
		task.wallet = (await credentialWalletGet({userTag: user.userTag})) || ''//checksummed address, or empty
	}
}
async function doorHandleBelow({door, body, action, browserHash}) {
	let task = {}

	if (action == 'Get.') {
		await attachState(task, browserHash)
		if (hasText(body.envelope)) {//client found an enrollment envelope cookie from a previous session
			try {
				let letter = await openEnvelope('EnrollTotpEnvelope.', body.envelope, {skipExpirationCheck: true})
				if (!isExpired(letter.expiration) && !task.totpEnrolled) {
					let secret = letter.secret
					let enrollment = await totpEnroll({
						secret: Data({base32: secret}),
						account: '@'+(task.user?.f1 || task.userTag || 'user'),
						brand: Key('domain, public'),
						label: true,
					})
					task.enrollment = {
						uri: enrollment.uri,
						envelope: body.envelope,
						identifier: enrollment.identifier,
					}
				}
			} catch (e) {/*stale or invalid envelope, silently ignore*/}
		}

	} else if (action == 'CheckNameTurnstile.') {
		let v = await credentialNameCheck({raw1: body.name1, raw2: body.name2})
		task.nameIsAvailable = !!v

	} else if (action == 'SignUpAndSignInTurnstile.') {
		//create new user with three credentials
		let userTag = Tag()
		let v = await credentialNameSet({userTag, raw1: body.name1, raw2: body.name2})
		if (!v) return {success: false, outcome: 'NameNotAvailable.'}
		await credentialPasswordSet({userTag, hash: body.hash, cycles: body.cycles})
		await credentialBrowserSet({userTag, browserHash})
		await attachState(task, browserHash)

	} else if (action == 'GetPasswordCyclesTurnstile.') {
		let v = validateName(body.userIdentifier, Limit.name)
		if (!v.ok) return {success: false, outcome: 'InvalidCredentials.'}
		let nameRecord = await credentialNameGet({f0: v.f0})
		if (!nameRecord) return {success: false, outcome: 'InvalidCredentials.'}
		let password = await credentialPasswordGet({userTag: nameRecord.userTag})
		if (!password) return {success: false, outcome: 'InvalidCredentials.'}
		task.cycles = password.cycles

	} else if (action == 'SignIn.') {
		let v = validateName(body.userIdentifier, Limit.name)
		if (!v.ok) return {success: false, outcome: 'InvalidCredentials.'}
		let nameRecord = await credentialNameGet({f0: v.f0})
		if (!nameRecord) return {success: false, outcome: 'InvalidCredentials.'}
		let password = await credentialPasswordGet({userTag: nameRecord.userTag})
		if (!password || !hasTextSame(body.hash, password.hash)) {
			return {success: false, outcome: 'InvalidCredentials.'}
		}
		await credentialBrowserSet({userTag: nameRecord.userTag, browserHash})
		await attachState(task, browserHash)

	} else {//remaining actions all require that there's a user signed into the requesting browser
		let user = await credentialBrowserGet({browserHash})
		if (!user) toss('state')

		if (action == 'SetName.') {
			let v = await credentialNameSet({userTag: user.userTag, raw1: body.name1, raw2: body.name2})
			if (!v) return {success: false, outcome: 'NameNotAvailable.'}

		} else if (action == 'RemoveName.') {
			await credentialNameRemove({userTag: user.userTag})

		} else if (action == 'SetPassword.') {
			//if user has a password, verify current password before allowing change
			let existing = await credentialPasswordGet({userTag: user.userTag})
			if (existing) {
				if (!body.currentHash || !hasTextSame(body.currentHash, existing.hash)) {
					return {success: false, outcome: 'WrongPassword.'}
				}
			}
			await credentialPasswordSet({userTag: user.userTag, hash: body.newHash, cycles: body.newCycles})

		} else if (action == 'RemovePassword.') {
			await credentialPasswordRemove({userTag: user.userTag})

		} else if (action == 'SignOut.') {
			await credentialBrowserRemove({userTag: user.userTag})

		//TOTP enrollment step 1: the user at browser wants to setup totp as a second factor. here at the server, we make sure they're not already enrolled, and generate a new random secret for the qr code
		} else if (action == 'TotpEnroll1.') {
			let existing = await credentialTotpGet({userTag: user.userTag})
			if (existing) toss('state', {action, user, browserHash, existing})//client thought enrollment was possible

			let userName = await credentialNameGet({userTag: user.userTag})//get name information for this user, if they have one
			let account = userName?.name?.f1 ? `@${userName.name.f1}` : null//later use email if the user has that, ttd march
			let enrollment = await totpEnroll({brand: Key('domain, public'), account, label: true})
			enrollment.envelope = await sealEnvelope('EnrollTotpEnvelope.', Limit.expirationUser, {
				secret: enrollment.secret,
				message: safefill`TOTP enrollment: browser ${browserHash}, user ${user.userTag}, secret ${enrollment.secret}`,
			})
			task.enrollment = enrollment

		//TOTP enrollment step 2: the user has gotten the secret into their authenticator app, and has their first code to validate. if they're right, we create their enrollment
		} else if (action == 'TotpEnroll2.') {
			checkTotpCode(body.code)
			let existing = await credentialTotpGet({userTag: user.userTag})
			if (existing) toss('state', {action, user, browserHash, existing})//client thought enrollment was possible
			let letter = await openEnvelope('EnrollTotpEnvelope.', body.envelope, {skipExpirationCheck: true})

			//decrypt the secret from the page, possibly via a cookie through a refresh
			let secret = letter.secret
			checkTotpSecret(secret)

			//make sure the page has given us back the same real valid secret we gave it in enrollment step 1 above
			if (isExpired(letter.expiration)) return {success: false, outcome: 'Expired.'}
			if (!hasTextSame(
				letter.message,
				safefill`TOTP enrollment: browser ${browserHash}, user ${user.userTag}, secret ${secret}`)) {
				toss('state', {action, user, browserHash, letter})//envelope tampered or transplanted
			}//➡️ passing this check is proof it's the real secret from step 1!

			//make sure the user can generate a valid code
			let valid = await totpValidate({secret: Data({base32: secret}), code: body.code})
			if (!valid) return {success: false, outcome: 'BadCode.'}//rate limiting not necessary during enrollment; the page still has the secret at this point!

			//save this new enrollment for this user
			await credentialTotpSet({userTag: user.userTag, secret})

		//an enrolled user wants to remove their totp enrollment, likely to setup a different one
		//right now we make this available without additional verification, ttd november2025
		} else if (action == 'TotpRemove.') {
			await credentialTotpRemove({userTag: user.userTag})

		//having previously enrolled, the user is signing in with totp
		//here on the server, we validate the code
		} else if (action == 'TotpValidate.') {
			let secret = await credentialTotpGet({userTag: user.userTag})
			if (!secret) toss('state')
			checkTotpSecret(secret)
			checkTotpCode(body.code)

			//protect guesses on this secret from a brute force attack, which would succeed quickly
			let n = await trailCount(
				safefill`TOTP wrong guess: secret ${secret}`,
				totpConstants.guardHorizon
			)
			if (n >= totpConstants.guardWrongGuesses) return {success: false, outcome: 'Later.'}

			//validate the page's guess
			let valid = await totpValidate({secret: Data({base32: secret}), code: body.code})
			if (valid) {//guess at code from page is correct

				log(`ttd november2025 🎃 user ${user.userTag} validated a code correctly, so we can let them in or sudo a transaction or something`)
				await trailAdd(
					safefill`TOTP right guess: secret ${secret}`//we can use this to detect if a user has a totp they haven't used in months, and maybe lost
				)

			} else {//guess at code from page is wrong

				await trailAdd(
					safefill`TOTP wrong guess: secret ${secret}`
				)
				return {success: false, outcome: 'Wrong.'}
			}

		//wallet proof step 1: page requests nonce to prove it controls an Ethereum address
		//the nonce and message go into an envelope so we can verify they haven't been tampered with on step 2
		} else if (action == 'WalletProve1.') {
			let address = checkWallet(body.address).f0//make sure the page gave us a good wallet address, and correct the case checksum
			let nonce = Tag()//generate a new random nonce for this enrollment; 21 base62 characters is random enough; MetaMask may show this
			let message = safefill`Add your wallet with an instant, zero-gas signature of code ${nonce}`//keepin copy short and non-scary for MetaMask's tiny little window

			let envelope = await sealEnvelope('ProveWallet.', Limit.expirationUser, {
				message: safefill`Ethereum signature: browser ${browserHash}, wallet ${address}, nonce ${nonce}, message ${message}`,
			})
			task.walletProve = {message, nonce, envelope}

		//wallet proof step 2: page calls back with signature of the nonce we gave it
		} else if (action == 'WalletProve2.') {

			//begin by making sure the page gave us all the parts we need and they look correct
			let address = checkWallet(body.address).f0
			let nonce = checkTag(body.nonce)//the page echos back the nonce; we must still be sure it's the same one as from before!
			let message = checkText(body.message)//should be the same message we sent; must contain the nonce
			let signature = checkText(body.signature)//signature looks like 0x followed by 130 or 132 base16 characters

			//confirm (1) the page has given us back the same real valid nonce and message we gave it in step 1 above
			let letter = await openEnvelope('ProveWallet.', body.envelope, {skipExpirationCheck: true})
			if (isExpired(letter.expiration)) return {success: false, outcome: 'Expired.'}//user walked away
			if (!hasTextSame(
				letter.message,
				safefill`Ethereum signature: browser ${browserHash}, wallet ${address}, nonce ${nonce}, message ${message}`)) {
				toss('state', {action, browserHash, letter})//envelope tampered or transplanted
			}

			//confirm (2) the message contains the nonce
			if (!message.includes(nonce)) toss('state', {action, browserHash, nonce, message})//not possible at this point, but included for completeness

			//confirm (3) the signature is of the message, and (4) the address created the signature
			let valid = await verifyMessage({address, message, signature})//viem confirms those two things for us
			if (!valid) return {success: false, outcome: 'BadSignature.'}

			//save this proven wallet address as a credential for this user
			log(`🖌 server has proof that browser ${browserHash} controls wallet ${address}`)
			await credentialWalletSet({userTag: user.userTag, address})

		//user wants to remove their connected wallet
		} else if (action == 'WalletRemove.') {
			await credentialWalletRemove({userTag: user.userTag})

		} else if (action == 'CloseAccount.') {
			await credentialCloseAccount({userTag: user.userTag})
		}
		await attachState(task, browserHash)
	}

	task.success = true
	return task
}
