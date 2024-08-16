
import { log, inspect, checkHash, checkText, hasText } from '../../library/library0.js'
import { checkTag } from '../../library/library1.js'
import { accessInsert, accessQuery } from '../../library/database.js'

export default defineEventHandler(async (event) => {
	let o = {}
	try {
		let body = await readBody(event)
		o.message = 'api account, version 2024aug16c'
		o.note = 'none'

		//first, validate what the untrusted client told us
		checkHash(body.browserHash)

		//validate the password, only needed to sign in
		let passwordValid = hasText(body.password) && body.password == process.env.ACCESS_PASSWORD
		o.passwordValid = passwordValid

		//is this browser already signed in?
		let rows = await accessQuery(body.browserHash)//get all the rows
		let signedIn1 = false
		if (rows.length && rows[0].signed_in) signedIn1 = true
		o.signedIn1 = signedIn1//whether the browser is signed in before this request changes anything
		o.signedIn2 = signedIn1//and after this request has perhaps changed things

		o.requestedAction = body.action
		if (body.action == 'action check') {//nothing more to do actually
		} else if (body.action == 'action out') {
			if (!signedIn1) {
				o.note = 'already signed out'
			} else {
				await accessInsert(body.browserHash, 0)//insert a row to sign out
				o.signedIn2 = false
				o.note = 'signed out'
			}
		} else if (body.action == 'action in') {
			if (signedIn1) {
				o.note = 'already signed in'
			} else {
				if (passwordValid) {//if password valid
					await accessInsert(body.browserHash, 1)//insert a row to sign in
					o.signedIn2 = true
					o.note = 'signed in'
				} else {
					o.note = 'wrong password'
				}
			}
		} else { toss('invalid action', {event, body, action: body.action}) }

	} catch (e) {
		log('api account caught: ', e)
		//TODO maybe return 400 bad request or 500 internal error or something?
		//and also log this to datadog or something
	}
	return o
})


/*
do you hit the database a third time at the end to confirm the change set?
can we reply on supabase not throwing or returning an error if the row didn't get in there
*/


/*
there needs to be server side logic so if the user is already signed in our out, they can't duplicate that
and also gray out buttons on the page

*/

