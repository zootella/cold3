
import {
log, look, hasText, checkTag,
doorWorker, accessWorker, getAccess,
accessTableInsert, accessTableQuery,
} from '@/library/grand.js'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker({workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}

	let access = await getAccess()
	o.message = 'api account, version 2024aug16c'
	o.note = 'none'

	//first, validate what the untrusted client told us
	checkTag(door.body.browserTag)

	//validate the password, only needed to sign in
	o.passwordValid = (door.body.password == access.get('ACCESS_PASSWORD_SECRET'))

	//is this browser already signed in?
	let rows = await accessTableQuery(door.body.browserTag)//get all the rows
	let signedIn1 = false
	if (rows.length && rows[0].signed_in) signedIn1 = true//most recent row sorted first
	o.signedIn1 = signedIn1//state before this request runs
	o.signedIn2 = signedIn1//state after, different if changed anything

	o.requestedAction = door.body.action
	if (door.body.action == 'action check') {//nothing more to do actually
	} else if (door.body.action == 'action out') {
		if (!signedIn1) {
			o.note = 'already signed out'
		} else {
			await accessTableInsert(door.body.browserTag, 0)//insert a row to sign out
			o.signedIn2 = false
			o.note = 'signed out'
		}
	} else if (door.body.action == 'action in') {
		if (signedIn1) {
			o.note = 'already signed in'
		} else {
			if (o.passwordValid) {//if password valid
				await accessTableInsert(door.body.browserTag, 1)//insert a row to sign in
				o.signedIn2 = true
				o.note = 'signed in'
			} else {
				o.note = 'wrong password'
			}
		}
	} else { toss('invalid action', {workerEvent, body: door.body, action: door.body.action}) }

	return o
}

/*
do you hit the database a third time at the end to confirm the change set?
can we reply on supabase not throwing or returning an error if the row didn't get in there
*/


/*
there needs to be server side logic so if the user is already signed in our out, they can't duplicate that
and also gray out buttons on the page

*/

