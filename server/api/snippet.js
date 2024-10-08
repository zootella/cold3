
import { createClient } from '@supabase/supabase-js'

import { log, look, hasText } from '@/library/library0.js'
import { Access, hasAccess } from '@/library/library2.js'
import { snippetGetCount } from '@/library/database.js'
import { dog, logAlert } from '@/library/cloud.js'
import { saveUseRuntimeConfigFunction, awaitDoorPromises } from '@/library/door.js'

export default defineEventHandler(async (event) => {
	let o = {}
	try {
		saveUseRuntimeConfigFunction(useRuntimeConfig)
		o.message = 'snippet v2027oct7d: ' + await snippetGetCount()


	} catch (e) {
		log('snippet caught', look(e))
	}
	return o
})














/*
notes from august:

do you hit the database a third time at the end to confirm the change set?
can we reply on supabase not throwing or returning an error if the row didn't get in there

there needs to be server side logic so if the user is already signed in our out, they can't duplicate that
and also gray out buttons on the page
*/

