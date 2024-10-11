
import {
log, look,
} from '@/library/grand.js'

export default defineEventHandler(async (event) => {
	let o = {}
	try {
		o.message = 'snippet 2024oct8a'


	} catch (e) {
		log('snippet caught', look(e))
		o.error = e.stack
	}
	return o
})

/*
october. you still want to know
if you jsut console.log here, can you see it in the cloudflare dashboard?
if not, why not? what does it mean that they made logging better?
https://blog.cloudflare.com/builder-day-2024-announcements/#logs-for-every-worker

october
can you use the door system here in this GET snippet?
probably not, as its going to try to read a body, but you want to


*/



/*
notes from august:

do you hit the database a third time at the end to confirm the change set?
can we reply on supabase not throwing or returning an error if the row didn't get in there

there needs to be server side logic so if the user is already signed in our out, they can't duplicate that
and also gray out buttons on the page
*/

