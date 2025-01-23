
import {
log, look, checkTag,
doorWorker, getAccess,
query_AccessTableInsert, query_AccessTableQuery,
timeSafeEqual,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}

	o.message = 'api account2, version 2025jan12a'
	o.note = 'none'

	//first, validate what the untrusted client told us
	checkTag(door.body.browserTag)

	//is this browser already signed in?
	let rows = await query_AccessTableQuery(door.body.browserTag)//get all the rows
	let signedIn1 = false
	if (rows.length && rows[0].signed_in) signedIn1 = true//most recent row sorted first
	o.signedIn1 = signedIn1//state before this request runs
	o.signedIn2 = signedIn1//state after, different if changed anything

	o.requestedAction = door.body.action
	if (door.body.action == 'SignAsk.') {//nothing more to do actually
	} else if (door.body.action == 'SignOut.') {
		if (!signedIn1) {
			o.note = 'already signed out'
		} else {
			await query_AccessTableInsert(door.body.browserTag, 0)//insert a row to sign out
			o.signedIn2 = false
			o.note = 'signed out'
		}
	} else if (door.body.action == 'SignIn.') {
		if (signedIn1) {
			o.note = 'already signed in'
		} else {
			const access = await getAccess()
			o.passwordValid = timeSafeEqual(door.body.password, access.get('ACCESS_PASSWORD_SECRET'))
			if (o.passwordValid) {//if password valid
				await query_AccessTableInsert(door.body.browserTag, 1)//insert a row to sign in
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
