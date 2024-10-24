
import {
log, look, Now, Tag,
accessWorker, awaitDoorPromises,
dog,
Sticker, snippet,
} from '@/library/grand.js'

export default defineEventHandler(async (workerEvent) => {
	accessWorker({workerEvent, useRuntimeConfig})
	let o = {}
	try {
		o.note = `worker snippet says: ${Sticker().all}, v2024oct21c`
		o.look = await snippet()

	} catch (e) { o.error = 'snippet worker error: '+e.stack }
	await awaitDoorPromises()
	return o
})

/*
october. you still want to know if console.log goes to teh cloudflare dashboard
if you jsut console.log here, can you see it in the cloudflare dashboard?
if not, why not? what does it mean that they made logging better?
https://blog.cloudflare.com/builder-day-2024-announcements/#logs-for-every-worker

october. can you use the door system in a simple GET snippet?
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

