
import {
hasTextSame,
validateName, checkAction, checkNumerals, validateEmailOrPhone,
credentialBrowserGet, credentialBrowserSet, credentialBrowserRemove,
credentialNameCheck, credentialNameSet, credentialNameGet, credentialNameRemove,
credentialPasswordSet, credentialPasswordGet, credentialPasswordRemove,
credentialTotpGet, credentialTotpSet, credentialTotpRemove,
credentialWalletGet, credentialWalletSet, credentialWalletRemove, credentialSet,
credentialOauthRemove, credentialOauthGet, oauthProviders,
credentialOtpSend, credentialOtpEnter, credentialOtpGet, credentialOtpRemove,
credentialCloseAccount,
totpEnroll, totpValidate, totpIdentifier, totpConstants,
otpConstants,
checkTotpCode, checkTotpSecret, checkWallet, Data, isExpired,
trailCount, trailAdd,
originDomain,
} from 'icarus'
import {createPublicClient, http} from 'viem'
import {mainnet} from 'viem/chains'
import {verifySiweMessage} from 'viem/siwe'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Get.', 'SignOut.', 'CheckNameTurnstile.', 'SignUpAndSignInTurnstile.', 'GetPasswordCyclesTurnstile.', 'SignIn.', 'SetName.', 'RemoveName.', 'SetPassword.', 'RemovePassword.', 'TotpEnroll1.', 'TotpEnroll2.', 'TotpRemove.', 'TotpValidate.', 'WalletProve1.', 'WalletProve2.', 'WalletRemove.', 'OauthRemove.', 'OtpSendTurnstile.', 'OtpEnter.', 'EmailRemove.', 'PhoneRemove.', 'CloseAccount.'], workerEvent, doorHandleBelow})
})

// 🟠 get
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
		task.oauths = await credentialOauthGet({userTag: user.userTag})
		task.emails = await credentialOtpGet({userTag: user.userTag, type: 'Email.'})//[{f0, f1, f2, event}, ...] event 4 proven, 3 code sent, 2 only mentioned
		task.phones = await credentialOtpGet({userTag: user.userTag, type: 'Phone.'})
	}
	//ttd march, lots of database chatter here, replace with a single query for all rows about userTag, and then careful trusted server side logic to sift through them to figure out what's applicable and what's historical. and in this process, decide if you're going to hide rows or not
}

// 🟠 otp challenges
async function openLetterOtp(body, browserHash) {//unpack this browser's active code challenges from the envelope the page kept in its cookie
	let letter//letter contains this browser's active code challenges, and gets passed cookie <--> page <--> server and down the stack
	if (hasText(body.envelopeOtp)) {
		letter = await openEnvelope('Otp.', body.envelopeOtp, {browserHash, skipExpirationCheck: true})//envelope must be authentic and browser hash must match; we skip the envelope expiration check because an old envelope can't contain young codes, and we filter old codes out next
	} else {
		letter = {otps: []}//no challenges from earlier, but make an empty array in case we add one
	}
	letter.otps = letter.otps.filter(o => Now() <= o.start + otpConstants.expiration)//filter to only keep not yet expired challenges
	return letter
}
async function attachLetterOtp(task, letter, browserHash) {//reseal the letter and attach the non-secret parts of active challenges to the response
	if (letter.otps.length > 0) {//we have active challenges for this browser
		letter.browserHash = browserHash//lock this letter to the connected browser
		task.envelopeOtp = await sealEnvelope('Otp.', otpConstants.expiration, letter)//encrypt it for the browser to keep for up to 20 minutes in a cookie
	} else {
		task.envelopeOtp = ''//nothing live; blank text, and the page clears its cookie if it's holding one--text or blank, no meanings loaded onto null or undefined
	}
	task.otps = letter.otps.map(o => ({//we always return an array of non-secret information about currently active challenges
		tag: o.tag,//a tag identifies each challenge; the page will tell us which one it's guessing at
		start: o.start,//the birthdate of this challenge, which lives for 20 minutes
		address: o.address,//the full address object with ok, f0, f1, f2, and type
		//the secret code we sent, like "123456" is o.answer; it's encrypted into envelope, and critically not leaked here to the page!
	}))
}
async function doorHandleBelow({door, body, action, browserHash}) {
	let task = {}

	// 🟠 get
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
		let letter//also recover any live otp code challenges at this browser, replacing the old FoundEnvelope. round trip
		try {
			letter = await openLetterOtp(body, browserHash)
		} catch (e) {/*corrupt or transplanted envelope; recovery is best effort, so render the page without challenges rather than failing every load--and attachLetterOtp below returns a blank envelope, so the page clears the bad cookie it's holding*/
			letter = {otps: []}
		}
		await attachLetterOtp(task, letter, browserHash)

	// 🟠 name
	} else if (action == 'CheckNameTurnstile.') {
		let v = await credentialNameCheck({raw1: body.name1, raw2: body.name2})
		task.nameIsAvailable = !!v

	// 🟠 name and password
	} else if (action == 'SignUpAndSignInTurnstile.') {
		//create new user with three credentials
		let userTag = Tag()
		let v = await credentialNameSet({userTag, raw1: body.name1, raw2: body.name2})
		if (!v) return {success: false, outcome: 'NameNotAvailable.'}
		await credentialPasswordSet({userTag, hash: body.hash, cycles: body.cycles})
		await credentialBrowserSet({userTag, browserHash})
		await attachState(task, browserHash)

	// 🟠 name and password
	} else if (action == 'GetPasswordCyclesTurnstile.') {
		let v = validateName(body.userIdentifier, Limit.name)
		if (!v.ok) return {success: false, outcome: 'InvalidCredentials.'}
		let nameRecord = await credentialNameGet({f0: v.f0})
		if (!nameRecord) return {success: false, outcome: 'InvalidCredentials.'}
		let password = await credentialPasswordGet({userTag: nameRecord.userTag})
		if (!password) return {success: false, outcome: 'InvalidCredentials.'}
		task.cycles = password.cycles

	// 🟠 name and password
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

	// 🟠 otp send
	//the person at the page has entered their email or phone to get a code there; an otp flow requires being signed in, the whole time, as the same user--answered with a graceful SignedOut. rather than a toss, because the demo box on page4 is reachable signed out
	//this action needs turnstile protection to prevent a script kiddie from hitting here to spam strangers or run up our amazon or twilio bill 💩💸
	} else if (action == 'OtpSendTurnstile.') {
		//look up the user signed in at this browser; ttd july, figure out for a new user joining with OTP, do we generate a provisional user tag early, or do we securely handle that flow another way?
		let user = await credentialBrowserGet({browserHash})
		//^ttd january, credential system will replace this
		if (!user) return {success: false, outcome: 'SignedOut.'}//the page ghosts its controls when signed out, so this answers direct posts and stale panels

		let {address, provider} = body
		checkText(address); checkText(provider)
		let v = validateEmailOrPhone(address)
		if (!v.ok) toss('form')
		provider = body.provider.trim().toUpperCase().slice(0, 1)
		if      (provider == 'A') provider = 'Amazon.'
		else if (provider == 'T') provider = 'Twilio.'
		else toss('form')//temporary to get started; the round robin system, not the page, should choose the provider, ttd january

		let letter = await openLetterOtp(body, browserHash)
		task = await credentialOtpSend({letter, v, provider, userTag: user.userTag})//sets task.success itself, with task.outcome 'CoolSoft.', 'CoolHard.', or 'Held.' when the answer is no
		await attachLetterOtp(task, letter, browserHash)
		await attachState(task, browserHash)
		return task//return here rather than falling through to the bottom, which would overwrite the success credentialOtpSend decided

	// 🟠 otp enter
	//the person at page has entered their guess at a code their browser knows about
	} else if (action == 'OtpEnter.') {
		let user = await credentialBrowserGet({browserHash})
		if (!user) return {success: false, outcome: 'SignedOut.'}//if they sign back in as the user who started the challenge, it's still live in their cookie

		let {tag, guess} = body//tag identifes the challenge; guess is what they entered (hopefully correctly from their email or texts)
		checkTag(tag); checkNumerals(guess)

		let letter = await openLetterOtp(body, browserHash)
		task = await credentialOtpEnter({letter, tag, guess, userTag: user.userTag})//sets task.success itself, with task.outcome 'Wrong.', 'Expired.', 'Held.', or 'SignedOut.' (a different user's challenge) when the answer is no
		await attachLetterOtp(task, letter, browserHash)
		await attachState(task, browserHash)
		return task

	} else {//remaining actions all require that there's a user signed into the requesting browser
		let user = await credentialBrowserGet({browserHash})
		if (!user) toss('state')

		// 🟠 name
		if (action == 'SetName.') {
			let v = await credentialNameSet({userTag: user.userTag, raw1: body.name1, raw2: body.name2})
			if (!v) return {success: false, outcome: 'NameNotAvailable.'}

		// 🟠 name
		} else if (action == 'RemoveName.') {
			await credentialNameRemove({userTag: user.userTag})

		// 🟠 password
		} else if (action == 'SetPassword.') {
			//if user has a password, verify current password before allowing change
			let existing = await credentialPasswordGet({userTag: user.userTag})
			if (existing) {
				if (!body.currentHash || !hasTextSame(body.currentHash, existing.hash)) {
					return {success: false, outcome: 'WrongPassword.'}
				}
			}
			await credentialPasswordSet({userTag: user.userTag, hash: body.newHash, cycles: body.newCycles})

		// 🟠 password
		} else if (action == 'RemovePassword.') {
			await credentialPasswordRemove({userTag: user.userTag})

		// 🟠 sign out
		} else if (action == 'SignOut.') {
			await credentialBrowserRemove({userTag: user.userTag})

		// 🟠 totp
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

		// 🟠 totp
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

		// 🟠 totp
		//an enrolled user wants to remove their totp enrollment, likely to setup a different one
		//right now we make this available without additional verification, ttd november2025
		} else if (action == 'TotpRemove.') {
			await credentialTotpRemove({userTag: user.userTag})

		// 🟠 totp
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

		// 🟠 wallet
		//wallet proof step 1: page requests nonce for SIWE (Sign-In with Ethereum, EIP-4361)
		//server generates the nonce and seals it with address+browserHash in an envelope for tamper protection
		//the page will construct the SIWE message client-side, sign it, and send it back in step 2
		} else if (action == 'WalletProve1.') {
			let address = checkWallet(body.address).f0//make sure the page gave us a good wallet address, and correct the case checksum
			await credentialSet({userTag: user.userTag, type: 'Ethereum.', event: 2, f0: address})//event 2: user's browser mentioned this address

			let nonce = Tag()//generate a new random nonce; 21 base62 characters; the page will embed this in the SIWE message
			let envelope = await sealEnvelope('ProveWallet.', Limit.expirationUser, {nonce, address, browserHash})
			await credentialSet({userTag: user.userTag, type: 'Ethereum.', event: 3, f0: address})//event 3: server challenges this address with a nonce
			task.walletProve = {nonce, envelope}

		// 🟠 wallet
		//wallet proof step 2: page calls back with a signed SIWE message
		//the page constructed the SIWE message client-side using createSiweMessage (viem/siwe) and signed it with the wallet
		} else if (action == 'WalletProve2.') {

			let address = checkWallet(body.address).f0
			let message = checkText(body.message)//the SIWE-formatted message the page constructed and signed
			let signature = checkText(body.signature)//0x followed by 130 or 132 base16 characters

			//open the envelope from step 1 to recover the nonce, address, and browserHash we sealed
			let letter = await openEnvelope('ProveWallet.', body.envelope, {skipExpirationCheck: true})
			if (isExpired(letter.expiration)) return {success: false, outcome: 'Expired.'}//user walked away
			if (letter.browserHash !== browserHash) toss('state', {action, browserHash, letter})//envelope from a different browser
			if (letter.address !== address) toss('state', {action, browserHash, letter})//envelope was for a different address

			//verifySiweMessage does it all: parses the SIWE message, checks domain, nonce, address, and expirationTime, verifies the signature
			//supports both EOA (ecrecover) and smart contract wallets (EIP-1271 on-chain call via the publicClient)
			//passing domain and time enforces that the SIWE message was signed for our origin and is still within its self-declared lifetime; defense-in-depth alongside the envelope's nonce+expiration
			let valid = await verifySiweMessage(
				createPublicClient({chain: mainnet, transport: http(Key('alchemy url, secret'))}),//secret server only Alchemy key with no Origin header requirements, separate from the Origin restricted client side key
				{message, signature, domain: originDomain(), nonce: letter.nonce, address, time: new Date()}
			)
			if (!valid) return {success: false, outcome: 'BadSignature.'}

			//save this proven wallet address as a credential for this user; ttd november2025, we'll save that in the database to sign this user up or in, essentially
			//more to do here about that after we smoke test and security audit this above...
			log(`🖌 server has proof that browser ${browserHash} controls wallet ${address}`)
			await credentialWalletSet({userTag: user.userTag, address})

		// 🟠 wallet
		//user wants to remove their connected wallet
		} else if (action == 'WalletRemove.') {
			await credentialWalletRemove({userTag: user.userTag})

		// 🟠 oauth
		//the user wants to discard their proof of control of a third party account with an oauth provider
		} else if (action == 'OauthRemove.') {
			checkAction(body.provider)
			if (!oauthProviders().some(p => p.tag == body.provider)) toss('state', {action, provider: body.provider})//whitelist check on the provider tag against the server's configured list
			await credentialOauthRemove({userTag: user.userTag, provider: body.provider})

		// 🟠 email and phone
		//the user wants to remove an address, proven or still pending; f0 is the normalized form from the list attachState returned
		} else if (action == 'EmailRemove.') {
			checkText(body.f0)
			await credentialOtpRemove({userTag: user.userTag, type: 'Email.', f0: body.f0})//scoped to this user's own rows, so a bad f0 can only hide nothing

		} else if (action == 'PhoneRemove.') {
			checkText(body.f0)
			await credentialOtpRemove({userTag: user.userTag, type: 'Phone.', f0: body.f0})

		// 🟠 account
		} else if (action == 'CloseAccount.') {
			await credentialCloseAccount({userTag: user.userTag})
		}

		await attachState(task, browserHash)
	}

	task.success = true
	return task
}
