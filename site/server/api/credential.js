
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
	let r = {}

	if (action == 'Get.') {
		r.browserHash = browserHash
		let user = await credentialBrowserGet({browserHash})
		if (user) {
			r.userTag = user.userTag
			let name = await credentialNameGet({userTag: user.userTag})
			if (name) r.name = name.v
			let password = await credentialPasswordGet({userTag: user.userTag})
			if (password) r.passwordCycles = password.cycles
		}

	} else if (action == 'CheckNameTurnstile.') {
		let v = await credentialNameCheck({raw1: body.name1, raw2: body.name2})
		r.nameIsAvailable = !!v

	} else if (action == 'SignUpAndSignInTurnstile.') {
		//create new user with three credentials
		let userTag = Tag()
		let v = await credentialNameSet({userTag, raw1: body.name1, raw2: body.name2})
		if (!v) { r.outcome = 'NameNotAvailable.'; return r }
		await credentialPasswordSet({userTag, hash: body.hash, cycles: body.cycles})
		await credentialBrowserSet({userTag, browserHash})

		r.outcome = 'SignedUp.'
		r.userTag = userTag

	} else {//remaining actions all require that there's a user signed into the requesting browser
		let user = await credentialBrowserGet({browserHash})
		if (!user) toss('state')

		if (action == 'SetName.') {
			let v = await credentialNameSet({userTag: user.userTag, raw1: body.name1, raw2: body.name2})
			if (!v) { r.outcome = 'NameNotAvailable.'; return r }
			r.outcome = 'NameSet.'

		} else if (action == 'RemoveName.') {
			await credentialNameRemove({userTag: user.userTag})
			r.removed = true

		} else if (action == 'RemovePassword.') {
			await credentialPasswordRemove({userTag: user.userTag})
			r.removed = true

		} else if (action == 'SignOut.') {
			await credentialBrowserRemove({userTag: user.userTag})
			r.signedOut = true

		} else if (action == 'CloseAccount.') {
			await credentialCloseAccount({userTag: user.userTag})
			r.closed = true
		}
	}

	return r
}
