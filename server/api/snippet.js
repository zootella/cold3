
import { log, look, hasText } from '../../library/library0.js'
import { checkTag } from '../../library/library1.js'
import { dog, flare } from '../../library/cloud.js'

export default defineEventHandler(async (event) => {
	let o = {}
	try {
		let body = await readBody(event)
		o.message = 'api snippet message'

		let v = '2024aug29 A1'
		log('log ' + v)
		dog('dog ' + v)
		flare('flare ' + v)
		o.note = 'note ' + v

	} catch (e) {
		log('api account caught: ', look(e))
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

