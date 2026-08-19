
import {
hasTextSame,
validateName, checkAction, checkNumerals, validateEmailOrPhone,
credentialBrowserGet, credentialBrowserSet, credentialBrowserRemove,
credentialNameCheck, credentialNameSet, credentialNameGet, credentialNameRemove,
credentialPasswordSet, credentialPasswordGet, credentialPasswordRemove,
credentialTotpGet, credentialTotpRemove,
credentialTotpEnroll1, credentialTotpEnroll2, credentialTotpRecover, credentialTotpClear,
credentialWalletGet, credentialWalletProve1, credentialWalletProve2, credentialWalletRemove,
credentialOauthRemove, credentialOauthGet, oauthProviders,
credentialOtpSend, credentialOtpEnter, credentialOtpGet, credentialOtpRemove,
credentialCloseAccount,
totpValidate, totpIdentifier, totpConstants,
brownieGetAll,
checkTotpCode, checkTotpSecret, checkWallet, Data,
trailCount, trailAdd,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Get.', 'SignOut.', 'CheckNameTurnstile.', 'SignUpAndSignInTurnstile.', 'GetPasswordCyclesTurnstile.', 'SignIn.', 'SetName.', 'RemoveName.', 'SetPassword.', 'RemovePassword.', 'TotpEnroll1.', 'TotpEnroll2.', 'TotpClear.', 'TotpRemove.', 'TotpValidate.', 'WalletProve1.', 'WalletProve2.', 'WalletRemove.', 'OauthRemove.', 'OtpSendTurnstile.', 'OtpEnter.', 'EmailRemove.', 'PhoneRemove.', 'CloseAccount.'], workerEvent, doorHandleBelow})
})

// 🟠 get
async function attachState(task, browserHash, letter) {//attach complete credential state to task — every credential type, every time, so one call gives the store everything it needs to render the full credential panel; letter is door.brownie, carrying the viewer's live otp challenges
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
	task.otps = []//in-flight flow truth rides every snapshot, owner-scoped to the signed-in viewer or none--so signing out clears the enter boxes and enrollment ui, and signing in reveals them
	if (user && letter) {
		let otps = [...brownieGetAll(letter, 'Email.', user.userTag), ...brownieGetAll(letter, 'Phone.', user.userTag)].sort((a, b) => a.start - b.start)//both types, back in the order they were sent
		task.otps = otps.map(o => ({//non-secret information about currently active challenges
			tag: o.tag,//a tag identifies each challenge; the page will tell us which one it's guessing at
			start: o.start,//the birthdate of this challenge, which lives for 20 minutes
			address: o.address,//the full address object with ok, f0, f1, f2, and type
			//the secret code we sent, like "123456" is o.answer; it stays sealed in the brownie, and critically is not leaked here to the page!
		}))
		let enrollment = await credentialTotpRecover({letter, userTag: user.userTag})//the viewer's in-flight totp enrollment rides the same way; cheap, because recover answers false as soon as it finds no note
		if (enrollment) task.enrollment = enrollment//{uri, identifier}, deterministic from the sealed secret, so every snapshot agrees; absent when nothing is in flight, which collapses the page's enrollment ui
	}
	//ttd march, lots of database chatter here, replace with a single query for all rows about userTag, and then careful trusted server side logic to sift through them to figure out what's applicable and what's historical. and in this process, decide if you're going to hide rows or not
}
async function doorHandleBelow({door, body, action, browserHash}) {
	let task = {}

	// 🟠 get
	if (action == 'Get.') {
		await attachState(task, browserHash, door.brownie)//the snapshot carries the viewer's live challenges and in-flight enrollment from the letter, so recovery after a refresh is just the page rendering the snapshot

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
		await attachState(task, browserHash, door.brownie)

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
		await attachState(task, browserHash, door.brownie)

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

		if (!door.brownie) door.brownie = {notes: []}//starting a flow where no brownie arrived; the door seals whatever the letter holds on the way out
		task = await credentialOtpSend({letter: door.brownie, v, provider, userTag: user.userTag, browserHash})//sets task.success itself, with task.outcome 'CoolSoft.', 'CoolHard.', or 'Held.' when the answer is no
		await attachState(task, browserHash, door.brownie)
		return task//return here rather than falling through to the bottom, which would overwrite the success credentialOtpSend decided

	// 🟠 otp enter
	//the person at page has entered their guess at a code their browser knows about
	} else if (action == 'OtpEnter.') {
		let user = await credentialBrowserGet({browserHash})
		if (!user) return {success: false, outcome: 'SignedOut.'}//if they sign back in as the user who started the challenge, it's still live in their cookie

		let {tag, guess} = body//tag identifes the challenge; guess is what they entered (hopefully correctly from their email or texts)
		checkTag(tag); checkNumerals(guess)

		task = await credentialOtpEnter({letter: door.brownie || {notes: []}, tag, guess, userTag: user.userTag})//sets task.success itself, with task.outcome 'Wrong.', 'Expired.', 'Held.', or 'SignedOut.' (a different user's challenge) when the answer is no; no brownie arrived means no challenge to find, and the graceful Expired. inside
		await attachState(task, browserHash, door.brownie)
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
			if (!door.brownie) door.brownie = {notes: []}//starting a flow where no brownie arrived; the door seals whatever the letter holds on the way out
			await credentialTotpEnroll1({letter: door.brownie, userTag: user.userTag})//puts the note in the letter; the tail's attachState reads it back into the snapshot, which is where the page gets the QR to show--the secret stays sealed in the brownie

		// 🟠 totp
		//TOTP enrollment step 2: the user has gotten the secret into their authenticator app, and has their first code to validate. if they're right, we create their enrollment
		} else if (action == 'TotpEnroll2.') {
			let result = await credentialTotpEnroll2({letter: door.brownie || {notes: []}, userTag: user.userTag, code: body.code})//no brownie arrived means no note to find, and the graceful Expired. answer below
			if (!result.ok) {//the failure response still carries the snapshot: BadCode. kept the note, so the enrollment ui stays; Expired. dropped it, so the ui collapses
				task.success = false; task.outcome = result.outcome
				await attachState(task, browserHash, door.brownie)
				return task
			}

		// 🟠 totp
		//the user backed out of an enrollment in flight; take their note out of the letter, and the door's delete or reseal cleans the page up
		} else if (action == 'TotpClear.') {
			if (door.brownie) credentialTotpClear({letter: door.brownie, userTag: user.userTag})//without a brownie there's nothing to cancel; a stale tab cancelling twice is a harmless no-op

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

		await attachState(task, browserHash, door.brownie)
	}

	task.success = true
	return task
}
