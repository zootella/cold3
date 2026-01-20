
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

async function attachState(task, browserHash) {//attach current credential state to task response
	task.browserHash = browserHash
	let user = await credentialBrowserGet({browserHash})
	if (user) {
		task.userTag = user.userTag
		let name = await credentialNameGet({userTag: user.userTag})
		if (name) task.userName = name.name
		let password = await credentialPasswordGet({userTag: user.userTag})
		if (password) task.passwordCycles = password.cycles
	}
}
async function doorHandleBelow({door, body, action, browserHash}) {
	let task = Task({name: 'credential api'})

	if (action == 'Get.') {
		await attachState(task, browserHash)

	} else if (action == 'CheckNameTurnstile.') {
		let v = await credentialNameCheck({raw1: body.name1, raw2: body.name2})
		task.nameIsAvailable = !!v

	} else if (action == 'SignUpAndSignInTurnstile.') {
		//create new user with three credentials
		let userTag = Tag()
		let v = await credentialNameSet({userTag, raw1: body.name1, raw2: body.name2})
		if (!v) { task.finish({success: false, outcome: 'NameNotAvailable.'}); return task }
		await credentialPasswordSet({userTag, hash: body.hash, cycles: body.cycles})
		await credentialBrowserSet({userTag, browserHash})
		await attachState(task, browserHash)

	} else if (action == 'GetPasswordCyclesTurnstile.') {
		let v = validateName(body.userIdentifier, Limit.name)
		if (!v.ok) { task.finish({success: false, outcome: 'InvalidCredentials.'}); return task }
		let nameRecord = await credentialNameGet({f0: v.f0})
		if (!nameRecord) { task.finish({success: false, outcome: 'InvalidCredentials.'}); return task }
		let password = await credentialPasswordGet({userTag: nameRecord.userTag})
		if (!password) { task.finish({success: false, outcome: 'InvalidCredentials.'}); return task }
		task.cycles = password.cycles

	} else if (action == 'SignIn.') {
		let v = validateName(body.userIdentifier, Limit.name)
		if (!v.ok) { task.finish({success: false, outcome: 'InvalidCredentials.'}); return task }
		let nameRecord = await credentialNameGet({f0: v.f0})
		if (!nameRecord) { task.finish({success: false, outcome: 'InvalidCredentials.'}); return task }
		let password = await credentialPasswordGet({userTag: nameRecord.userTag})
		if (!password || !hasTextSame(body.hash, password.hash)) {
			task.finish({success: false, outcome: 'InvalidCredentials.'}); return task
		}
		await credentialBrowserSet({userTag: nameRecord.userTag, browserHash})
		await attachState(task, browserHash)

	} else {//remaining actions all require that there's a user signed into the requesting browser
		let user = await credentialBrowserGet({browserHash})
		if (!user) toss('state')

		if (action == 'SetName.') {
			let v = await credentialNameSet({userTag: user.userTag, raw1: body.name1, raw2: body.name2})
			if (!v) { task.finish({success: false, outcome: 'NameNotAvailable.'}); return task }

		} else if (action == 'RemoveName.') {
			await credentialNameRemove({userTag: user.userTag})

		} else if (action == 'SetPassword.') {
			//if user has a password, verify current password before allowing change
			let existing = await credentialPasswordGet({userTag: user.userTag})
			if (existing) {
				if (!body.currentHash || !hasTextSame(body.currentHash, existing.hash)) {
					task.finish({success: false, outcome: 'WrongPassword.'}); return task
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
		await attachState(task, browserHash)
	}

	task.finish({success: true})
	return task
}
