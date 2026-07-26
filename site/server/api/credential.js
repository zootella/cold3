
import {
hasTextSame,
validateName, checkAction, checkNumerals, validateEmailOrPhone,
credentialBrowserGet, credentialBrowserSet, credentialBrowserRemove,
credentialNameCheck, credentialNameSet, credentialNameGet, credentialNameRemove,
credentialPasswordSet, credentialPasswordGet, credentialPasswordRemove,
credentialTotpGet, credentialTotpRemove,
credentialTotpEnroll1, credentialTotpEnroll2, credentialTotpRecover,
credentialWalletGet, credentialWalletProve1, credentialWalletProve2, credentialWalletRemove,
credentialOauthRemove, credentialOauthGet, oauthProviders,
credentialOtpSend, credentialOtpEnter, credentialOtpGet, credentialOtpRemove,
credentialCloseAccount,
totpValidate, totpIdentifier, totpConstants,
otpConstants,
checkTotpCode, checkTotpSecret, checkWallet, Data,
trailCount, trailAdd,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Get.', 'SignOut.', 'CheckNameTurnstile.', 'SignUpAndSignInTurnstile.', 'GetPasswordCyclesTurnstile.', 'SignIn.', 'SetName.', 'RemoveName.', 'SetPassword.', 'RemovePassword.', 'TotpEnroll1.', 'TotpEnroll2.', 'TotpEnrollCancel.', 'TotpRemove.', 'TotpValidate.', 'WalletProve1.', 'WalletProve2.', 'WalletRemove.', 'OauthRemove.', 'OtpSendTurnstile.', 'OtpEnter.', 'EmailRemove.', 'PhoneRemove.', 'CloseAccount.'], workerEvent, doorHandleBelow})
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
		task.wallets = await credentialWalletGet({userTag: user.userTag})//[address, ...] checksummed, zero one or two
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
// 🟠 the brownie
//the brownie is the per-user localStorage entry where the page parks its one sealed envelope of in-flight credential items. The page can't read or change the letter inside--it sends the ciphertext up in POST bodies, and we alone open it, check that it belongs to the signed-in user at this browser, and answer with a resealed replacement as text, or blank to say delete
async function openLetterBrownie(body, browserHash, userTag) {//unpack the letter of in-flight items from the brownie the page sent, or start a fresh letter if it held nothing
	let letter
	if (hasText(body.brownie)) {
		letter = await openEnvelope('Brownie.', body.brownie, {browserHash, skipExpirationCheck: true})//authentic and from this browser; the item expirations filtered next are what govern the contents
		if (letter.userTag != userTag) toss('state', {userTag})//two users sharing a browser profile share a browserHash, so the check above can't tell them apart--this owner check is what keeps one housemate's brownie from crossing into the other's session. And the per-user localStorage key means an honest page never sends someone else's, so a mismatch here is tampering or our own bug
	} else {
		letter = {userTag, browserHash, items: []}//no brownie held; start fresh
	}
	letter.items = letter.items.filter(i => Now() <= i.expiration)//the server cleans expired items on open, the way openLetterOtp filters dead challenges
	return letter
}
async function attachLetterBrownie(task, letter, browserHash, userTag) {//reseal the letter and attach it for the page to park in localStorage
	if (letter.items.length > 0) {
		letter.userTag = userTag; letter.browserHash = browserHash//stamp the letter's identity; openLetterBrownie and the level3 flows check these
		let expiration = Math.max(...letter.items.map(i => i.expiration))//the container's shelf life is the latest of its items
		task.brownie = await sealEnvelope('Brownie.', expiration - Now(), letter)//sealEnvelope writes letter.expiration as now plus duration, which lands exactly on that latest item
		task.brownieExpiration = expiration//in plain sight beside the ciphertext, so the page can name its localStorage key and later sweep expired entries locally
	} else {
		task.brownie = ''//nothing in flight; blank text, and the page deletes the entry it's holding--text or blank, no meanings loaded onto null or undefined
	}
}
async function doorHandleBelow({door, body, action, browserHash}) {
	let task = {}

	// 🟠 get
	if (action == 'Get.') {
		await attachState(task, browserHash)
		if (task.userTag && hasText(body.brownie)) {//the page found this user's brownie in localStorage; localStorage is client-only, so this recovery arrives as a follow-up after mount rather than during the server render
			let letterBrownie
			try {
				letterBrownie = await openLetterBrownie(body, browserHash, task.userTag)
			} catch (e) {/*corrupt, transplanted, or cross-played; recovery is best effort, so render without it--and attachLetterBrownie below returns blank, so the page deletes the bad entry it's holding*/
				letterBrownie = {userTag: task.userTag, browserHash, items: []}
			}
			let enrollment = await credentialTotpRecover({letter: letterBrownie, userTag: task.userTag, browserHash})
			if (enrollment) task.enrollment = enrollment
			await attachLetterBrownie(task, letterBrownie, browserHash, task.userTag)
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
			let letter = await openLetterBrownie(body, browserHash, user.userTag)
			task.enrollment = await credentialTotpEnroll1({letter, userTag: user.userTag})//the page shows this as a QR code; the secret rides only in the letter, sealed next
			await attachLetterBrownie(task, letter, browserHash, user.userTag)

		// 🟠 totp
		//TOTP enrollment step 2: the user has gotten the secret into their authenticator app, and has their first code to validate. if they're right, we create their enrollment
		} else if (action == 'TotpEnroll2.') {
			let letter = await openLetterBrownie(body, browserHash, user.userTag)
			let result = await credentialTotpEnroll2({letter, userTag: user.userTag, browserHash, code: body.code})
			await attachLetterBrownie(task, letter, browserHash, user.userTag)//sad paths carry the letter too: a wrong code keeps the enrollment for retry, an expired one left the letter and the page deletes on blank
			if (!result.ok) { task.success = false; task.outcome = result.outcome; return task }//return task rather than a fresh object, so the brownie fields ride along

		// 🟠 totp
		//the user backed out of a two-step enrollment; drop the in-flight item so a refresh doesn't resurrect it--other items in the letter ride on undisturbed
		} else if (action == 'TotpEnrollCancel.') {
			let letter = await openLetterBrownie(body, browserHash, user.userTag)
			letter.items = letter.items.filter(i => i.type != 'Totp.')
			await attachLetterBrownie(task, letter, browserHash, user.userTag)

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
		//wallet proof step 1: page requests a nonce for SIWE (Sign-In with Ethereum, EIP-4361)
		//the flow itself is in level3 where grid tests reach it; here we only normalize what the page sent and add the browserHash the door resolved
		} else if (action == 'WalletProve1.') {
			let address = checkWallet(body.address).f0//make sure the page gave us a good wallet address, and correct the case checksum
			let prove = await credentialWalletProve1({userTag: user.userTag, browserHash, address})
			if (prove.outcome) return {success: false, outcome: prove.outcome}//a rule declined before any nonce was minted, so the user's wallet is never opened for a proof we'd refuse
			task.walletProve = prove//{nonce, envelope} for the page to sign against and hand back at step 2

		// 🟠 wallet
		//wallet proof step 2: page calls back with the SIWE message it constructed using createSiweMessage (viem/siwe) and the wallet's signature over it
		} else if (action == 'WalletProve2.') {
			let address = checkWallet(body.address).f0
			let result = await credentialWalletProve2({
				userTag: user.userTag, browserHash, address,
				message: body.message, signature: body.signature, envelope: body.envelope,
			})
			if (!result.ok) return {success: false, outcome: result.outcome}

		// 🟠 wallet
		//user wants to remove one of their proven wallets; f0 is the checksummed address from the list attachState returned
		} else if (action == 'WalletRemove.') {
			let address = checkWallet(body.f0).f0//correct the case checksum, the same way both prove steps do, because the rows are matched on f0 by equality
			await credentialWalletRemove({userTag: user.userTag, f0: address})//scoped to this user's own rows, so an address they don't hold can only hide nothing

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
