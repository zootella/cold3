
import {
credentialBrowserGet, credentialBrowserSet, credentialBrowserRemove,
credentialNameCheck, credentialNameSet, credentialNameGet, credentialNameRemove,
credentialPasswordSet, credentialPasswordGet, credentialPasswordRemove,
credentialCloseAccount,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Get.', 'SignOut.', 'CheckNameTurnstile.', 'SignUpAndSignInTurnstile.', 'SetName.', 'RemoveName.', 'RemovePassword.', 'CloseAccount.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {
	let task = Task({name: 'credential api'})

	if (action == 'Get.') {
		task.browserHash = browserHash
		let user = await credentialBrowserGet({browserHash})
		if (user) {
			task.userTag = user.userTag
			let name = await credentialNameGet({userTag: user.userTag})
			if (name) task.name = name.v
			let password = await credentialPasswordGet({userTag: user.userTag})
			if (password) task.passwordCycles = password.cycles
		}

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
		task.userTag = userTag

	} else {//remaining actions all require that there's a user signed into the requesting browser
		let user = await credentialBrowserGet({browserHash})
		if (!user) toss('state')

		if (action == 'SetName.') {
			let v = await credentialNameSet({userTag: user.userTag, raw1: body.name1, raw2: body.name2})
			if (!v) { task.finish({success: false, outcome: 'NameNotAvailable.'}); return task }

		} else if (action == 'RemoveName.') {
			await credentialNameRemove({userTag: user.userTag})

		} else if (action == 'RemovePassword.') {
			await credentialPasswordRemove({userTag: user.userTag})

		} else if (action == 'SignOut.') {
			await credentialBrowserRemove({userTag: user.userTag})

		} else if (action == 'CloseAccount.') {
			await credentialCloseAccount({userTag: user.userTag})
		}
	}

	task.finish({success: true})
	return task
}
