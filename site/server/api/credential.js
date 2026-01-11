
import {
Tag,
credentialBrowserGet, credentialBrowserSet, credentialBrowserRemove,
credentialNameCheck, credentialNameSet, credentialNameGet, credentialNameRemove,
credentialPasswordSet, credentialPasswordGet, credentialPasswordRemove,
credentialCloseAccount,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Get.', 'SignOut.', 'CheckNameTurnstile.', 'SignUpAndSignInTurnstile.', 'RemoveName.', 'RemovePassword.', 'CloseAccount.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {
	let r = {}

	if (action == 'Get.') {
		r.browserHash = browserHash
		let browser = await credentialBrowserGet({browserHash})
		if (browser) {
			r.userTag = browser.userTag
			let name = await credentialNameGet({userTag: browser.userTag})
			if (name) r.name = name.v
			let password = await credentialPasswordGet({userTag: browser.userTag})
			if (password) r.passwordCycles = password.cycles
		}

	} else if (action == 'SignOut.') {
		let browser = await credentialBrowserGet({browserHash})
		if (browser) {
			await credentialBrowserRemove({userTag: browser.userTag})
			r.signedOut = true
		}

	} else if (action == 'CheckNameTurnstile.') {
		let v = await credentialNameCheck({raw1: body.raw1, raw2: body.raw2})
		r.nameIsAvailable = !!v

	} else if (action == 'SignUpAndSignInTurnstile.') {
		//create new user with three credentials
		let userTag = Tag()
		let v = await credentialNameSet({userTag, raw1: body.raw1, raw2: body.raw2})
		if (!v) { r.outcome = 'NameNotAvailable.'; return r }
		await credentialPasswordSet({userTag, hash: body.hash, cycles: body.cycles})
		await credentialBrowserSet({userTag, browserHash})

		r.outcome = 'SignedUp.'
		r.userTag = userTag

	} else if (action == 'RemoveName.') {
		let browser = await credentialBrowserGet({browserHash})
		if (browser) {
			await credentialNameRemove({userTag: browser.userTag})
			r.removed = true
		}

	} else if (action == 'RemovePassword.') {
		let browser = await credentialBrowserGet({browserHash})
		if (browser) {
			await credentialPasswordRemove({userTag: browser.userTag})
			r.removed = true
		}

	} else if (action == 'CloseAccount.') {
		let browser = await credentialBrowserGet({browserHash})
		if (browser) {
			await credentialCloseAccount({userTag: browser.userTag})
			r.closed = true
		}
	}

	return r
}
