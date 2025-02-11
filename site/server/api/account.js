
import {
log, look, checkTag,
doorWorker, getAccess,
legacyAccessSet, legacyAccessGet,
timeSafeEqual,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let r = {}

	r.message = 'api account, version 2025jan27a'
	r.note = 'none'

	//first, validate what the untrusted client told us
	checkTag(body.browserTag)

	//is this browser already signed in?
	r.signedIn1 = r.signedIn2 = await legacyAccessGet(body.browserTag)

	r.requestedAction = action
	if (action == 'SignGet.') {//nothing more to do actually
	} else if (action == 'SignOut.') {
		if (!r.signedIn1) {
			r.note = 'already signed out'
		} else {
			await legacyAccessSet(body.browserTag, false)
			r.signedIn2 = false
			r.note = 'signed out'
		}
	} else if (action == 'SignIn.') {
		if (r.signedIn1) {
			r.note = 'already signed in'
		} else {
			let access = await getAccess()
			r.passwordValid = timeSafeEqual(body.password, access.get('ACCESS_PASSWORD_SECRET'))
			if (r.passwordValid) {//if password valid
				await legacyAccessSet(body.browserTag, true)
				r.signedIn2 = true
				r.note = 'signed in'
			} else {
				r.note = 'wrong password'
			}
		}
	} else { toss('invalid action', {workerEvent, body, action}) }

	return r
}
