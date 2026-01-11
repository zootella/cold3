
import {
Tag,
credentialBrowserGet, credentialBrowserSet, credentialBrowserRemove,
credentialNameCheck, credentialNameSet, credentialNameGet,
credentialPasswordSet, credentialPasswordGet,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Get.', 'SignOut.', 'CheckName.', 'SignUpAndSignIn.'], workerEvent, doorHandleBelow})
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

	} else if (action == 'CheckName.') {
		let v = await credentialNameCheck({raw1: body.slug, raw2: body.display})
		if (!v) { r.outcome = 'NameNotAvailable.'; return r }
		r.outcome = 'NameAvailable.'
		r.v = v

	} else if (action == 'SignUpAndSignIn.') {
		//create new user with three credentials
		let userTag = Tag()
		let v = await credentialNameSet({userTag, raw1: body.slug, raw2: body.display})
		if (!v) { r.outcome = 'NameNotAvailable.'; return r }
		await credentialPasswordSet({userTag, hash: body.hash, cycles: body.cycles})
		await credentialBrowserSet({userTag, browserHash})

		r.outcome = 'SignedUp.'
		r.userTag = userTag
	}

	return r
}
