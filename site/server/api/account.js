
import {
log, look, checkTag,
doorWorker, getAccess,
browserSignedInSet, browserSignedInGet,
timeSafeEqual,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}

	o.message = 'api account, version 2025jan27a'
	o.note = 'none'

	//first, validate what the untrusted client told us
	checkTag(door.body.browserTag)

	//is this browser already signed in?
	o.signedIn1 = o.signedIn2 = await browserSignedInGet(door.body.browserTag)

	o.requestedAction = door.body.action
	if (door.body.action == 'SignGet.') {//nothing more to do actually
	} else if (door.body.action == 'SignOut.') {
		if (!o.signedIn1) {
			o.note = 'already signed out'
		} else {
			await browserSignedInSet(door.body.browserTag, false)
			o.signedIn2 = false
			o.note = 'signed out'
		}
	} else if (door.body.action == 'SignIn.') {
		if (o.signedIn1) {
			o.note = 'already signed in'
		} else {
			let access = await getAccess()
			o.passwordValid = timeSafeEqual(door.body.password, access.get('ACCESS_PASSWORD_SECRET'))
			if (o.passwordValid) {//if password valid
				await browserSignedInSet(door.body.browserTag, true)
				o.signedIn2 = true
				o.note = 'signed in'
			} else {
				o.note = 'wrong password'
			}
		}
	} else { toss('invalid action', {workerEvent, body: door.body, action: door.body.action}) }

	return o
}
