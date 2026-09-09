
import {
hasTextSame,
validateName, checkAction, checkNumerals, validateEmailOrPhone,
credentialBrowserGet, credentialBrowserSet, credentialBrowserRemove,
credentialNameCheck, credentialNameSet, credentialNameGet, credentialNameRemove,
credentialPasswordSet, credentialPasswordGet, credentialPasswordRemove, credentialPasswordVerify,
credentialTotpGet, credentialTotpRemove, credentialTotpVerify,
credentialTotpEnroll1, credentialTotpEnroll2, credentialTotpClear,
credentialWalletGet, credentialWalletProve1, credentialWalletProve2, credentialWalletRemove,
credentialOauthRemove, credentialOauthGet, oauthProviders,
credentialOtpSend, credentialOtpEnter, credentialOtpGet, credentialOtpRemove,
credentialCloseAccount,
totpIdentifier, checkWallet, Data, toTextOrBlank,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Get.', 'SignOut.', 'CheckNameTurnstile.', 'SignUpAndSignInTurnstile.', 'GetPasswordCyclesTurnstile.', 'SignIn.', 'SetName.', 'RemoveName.', 'SetPassword.', 'RemovePassword.', 'TotpEnroll1.', 'TotpEnroll2.', 'TotpClear.', 'TotpRemove.', 'TotpValidate.', 'WalletProve1.', 'WalletProve2.', 'WalletRemove.', 'OauthRemove.', 'OtpSendTurnstile.', 'OtpEnter.', 'EmailRemove.', 'PhoneRemove.', 'CloseAccount.'], workerEvent, doorHandleBelow})
})

// 🟠 get
async function attachState(task, browserHash) {//attach complete credential state to task — every credential type, every time, so one call gives the store everything it needs to render the full credential panel
	task.browserHash = browserHash
	task.otps = []//in-flight flow truth rides every snapshot, owner-scoped to the signed-in viewer or none--so signing out clears the enter boxes and enrollment ui, and signing in reveals them
	let user = await credentialBrowserGet({browserHash})
	if (user) {
		task.userTag = user.userTag
		let name = await credentialNameGet({userTag: user.userTag})
		if (name) task.user = name.name
		let password = await credentialPasswordGet({userTag: user.userTag})
		if (password) task.passwordCycles = password.cycles
		let totp = await credentialTotpGet({userTag: user.userTag})//{secret, enrollment} from one read: the proven secret or blank, and the in-flight enrollment or false
		if (totp.secret) {
			task.totpEnrolled = true
			task.totpIdentifier = await totpIdentifier({secret: Data({base32: totp.secret})})
		} else {
			task.totpEnrolled = false
			task.totpIdentifier = ''
		}
		if (totp.enrollment) task.enrollment = totp.enrollment//{uri, identifier}, rebuilt from the row's secret, so every snapshot agrees, the server render included; absent when nothing is in flight, which collapses the page's enrollment ui
		task.wallets = await credentialWalletGet({userTag: user.userTag})//[address, ...] checksummed, zero one or two
		task.oauths = await credentialOauthGet({userTag: user.userTag})
		let emails = await credentialOtpGet({userTag: user.userTag, type: 'Email.'})//{addresses, challenges} from one read: [{f0, f1, f2, event}, ...] with event 'Proven.', 'Challenged.' for a code sent, or 'Mentioned.', and the live challenges among them
		let phones = await credentialOtpGet({userTag: user.userTag, type: 'Phone.'})
		task.emails = emails.addresses
		task.phones = phones.addresses
		task.otps = [...emails.challenges, ...phones.challenges].sort((a, b) => a.start - b.start)//the viewer's live code challenges, both types in the order they were sent, each a tag the page sends back with its guess, a start for the clock, and an address; the answer lives in the trail as a hash, and critically is not leaked here to the page!
	}
	//ttd march, lots of database chatter here, replace with a single query for all rows about userTag, and then careful trusted server side logic to sift through them to figure out what's applicable and what's historical. and in this process, decide if you're going to hide rows or not
}
async function doorHandleBelow({door, body, action, browserHash}) {
	let task = {}

	// 🟠 get
	if (action == 'Get.') {
		await attachState(task, browserHash)//the snapshot carries the viewer's live challenges and in-flight enrollment from credential_table, so recovery after a refresh is just the page rendering the snapshot

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
		let user = await credentialPasswordVerify({raw: body.userIdentifier, hash: body.hash})//{userTag} on a match; false on an unknown name or a wrong hash, after the ledger row that shows a run of misses
		if (!user) return {success: false, outcome: 'InvalidCredentials.'}//one answer for every miss, so a stranger can't learn which names exist
		await credentialBrowserSet({userTag: user.userTag, browserHash})
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

		task = await credentialOtpSend({v, provider, userTag: user.userTag})//sets task.success itself, with task.outcome 'CoolSoft.', 'CoolHard.', or 'Held.' when the answer is no
		await attachState(task, browserHash)
		return task//return here rather than falling through to the bottom, which would overwrite the success credentialOtpSend decided

	// 🟠 otp enter
	//the person at page has entered their guess at a code their browser knows about
	} else if (action == 'OtpEnter.') {
		let user = await credentialBrowserGet({browserHash})
		if (!user) return {success: false, outcome: 'SignedOut.'}//if they sign back in as the user who started the challenge, it's still live in the table

		let {tag, guess} = body//tag identifes the challenge; guess is what they entered (hopefully correctly from their email or texts)
		checkTag(tag); checkNumerals(guess)

		task = await credentialOtpEnter({tag, guess, userTag: user.userTag})//sets task.success itself, with task.outcome 'Wrong.', 'Expired.', or 'Held.' when the answer is no; a tag that isn't this user's live challenge gets the graceful Expired. inside
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
			await credentialTotpEnroll1({userTag: user.userTag})//writes the start as a challenged row; the tail's attachState reads it back into the snapshot, which is where the page gets the QR to show

		// 🟠 totp
		//TOTP enrollment step 2: the user has gotten the secret into their authenticator app, and has their first code to validate. if they're right, we create their enrollment
		} else if (action == 'TotpEnroll2.') {
			let result = await credentialTotpEnroll2({userTag: user.userTag, code: body.code})
			if (!result.ok) {//the failure response still carries the snapshot: BadCode. left the start standing, so the enrollment ui stays; Expired. found none, so the ui collapses
				task.success = false; task.outcome = result.outcome
				await attachState(task, browserHash)
				return task
			}

		// 🟠 totp
		//the user backed out of an enrollment in flight; hide their start, and the tail's snapshot cleans the page up
		} else if (action == 'TotpClear.') {
			await credentialTotpClear({userTag: user.userTag})//a stale tab cancelling twice is a harmless no-op

		// 🟠 totp
		//an enrolled user wants to remove their totp enrollment, likely to setup a different one
		//right now we make this available without additional verification, ttd november2025
		} else if (action == 'TotpRemove.') {
			await credentialTotpRemove({userTag: user.userTag})

		// 🟠 totp
		//having previously enrolled, the user is signing in with totp
		//here on the server, we validate the code
		} else if (action == 'TotpValidate.') {
			let result = await credentialTotpVerify({userTag: user.userTag, code: body.code})//checks the code against her secret, behind the guard against brute force, and writes the ledger rows that show an attacker at the inner door
			if (!result.ok) return {success: false, outcome: result.outcome}//Wrong., or Later. when the guard has tripped

		// 🟠 wallet
		//wallet proof step 1: page requests a nonce for SIWE (Sign-In with Ethereum, EIP-4361)
		//the flow itself is in level3 where grid tests reach it; here we only normalize what the page sent
		} else if (action == 'WalletProve1.') {
			let address = checkWallet(body.address).f0//make sure the page gave us a good wallet address, and correct the case checksum
			let prove = await credentialWalletProve1({userTag: user.userTag, address, connector: body.connector})//the page says which connector it used, Injected. or WalletConnect., and the flow refuses any other word
			if (prove.outcome) return {success: false, outcome: prove.outcome}//a rule declined before any nonce was minted, so the user's wallet is never opened for a proof we'd refuse
			task.walletProve = prove//{nonce} for the page to sign against

		// 🟠 wallet
		//wallet proof step 2: page calls back with the SIWE message it constructed using createSiweMessage (viem/siwe) and the wallet's signature over it
		} else if (action == 'WalletProve2.') {
			let address = checkWallet(body.address).f0
			let result = await credentialWalletProve2({userTag: user.userTag, address, message: body.message, signature: body.signature})
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
