
import {
hasTextSame,
validateName,
credentialBrowserGet, credentialBrowserSet, credentialBrowserRemove,
credentialNameCheck, credentialNameSet, credentialNameGet, credentialNameRemove,
credentialPasswordSet, credentialPasswordGet, credentialPasswordRemove,
credentialCloseAccount,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Get.', 'SignOut.', 'CheckNameTurnstile.', 'SignUpAndSignInTurnstile.', 'GetPasswordCyclesTurnstile.', 'SignIn.', 'SetName.', 'RemoveName.', 'SetPassword.', 'RemovePassword.', 'CloseAccount.'], workerEvent, doorHandleBelow})
})

async function attachState(response, browserHash) {//attach current credential state to response
	response.browserHash = browserHash
	let user = await credentialBrowserGet({browserHash})
	if (user) {
		response.userTag = user.userTag
		let name = await credentialNameGet({userTag: user.userTag})
		if (name) response.user = name.name
		let password = await credentialPasswordGet({userTag: user.userTag})
		if (password) response.passwordCycles = password.cycles
	}
}
async function doorHandleBelow({door, body, action, browserHash}) {
	let response = {}

	if (action == 'Get.') {
		await attachState(response, browserHash)

	} else if (action == 'CheckNameTurnstile.') {
		let v = await credentialNameCheck({raw1: body.name1, raw2: body.name2})
		response.nameIsAvailable = !!v

	} else if (action == 'SignUpAndSignInTurnstile.') {
		//create new user with three credentials
		let userTag = Tag()
		let v = await credentialNameSet({userTag, raw1: body.name1, raw2: body.name2})
		if (!v) return {success: false, outcome: 'NameNotAvailable.'}
		await credentialPasswordSet({userTag, hash: body.hash, cycles: body.cycles})
		await credentialBrowserSet({userTag, browserHash})
		await attachState(response, browserHash)

	} else if (action == 'GetPasswordCyclesTurnstile.') {
		let v = validateName(body.userIdentifier, Limit.name)
		if (!v.ok) return {success: false, outcome: 'InvalidCredentials.'}
		let nameRecord = await credentialNameGet({f0: v.f0})
		if (!nameRecord) return {success: false, outcome: 'InvalidCredentials.'}
		let password = await credentialPasswordGet({userTag: nameRecord.userTag})
		if (!password) return {success: false, outcome: 'InvalidCredentials.'}
		response.cycles = password.cycles

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
		await attachState(response, browserHash)

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

		} else if (action == 'CloseAccount.') {
			await credentialCloseAccount({userTag: user.userTag})
		}
		await attachState(response, browserHash)
	}

	response.success = true
	return response
}
