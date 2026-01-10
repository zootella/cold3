
import {
credentialBrowserGet,
credentialBrowserRemove,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Get.', 'SignOut.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {
	let r = {}

	if (action == 'Get.') {
		r.browserHash = browserHash
		let browser = await credentialBrowserGet({browserHash})
		if (browser) r.userTag = browser.userTag

	} else if (action == 'SignOut.') {
		let browser = await credentialBrowserGet({browserHash})
		if (browser) {
			await credentialBrowserRemove({userTag: browser.userTag})
			r.signedOut = true
		}
	}

	return r
}
