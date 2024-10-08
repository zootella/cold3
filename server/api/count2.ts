
import { createClient } from '@supabase/supabase-js'

import { log, look, hasText } from '@/library/library0.js'
import { Access, hasAccess } from '@/library/library2.js'
import { rowExistsBetter, createRowBetter, readRowBetter, writeRowBetter } from '@/library/database.js'
import { dog, logAlert } from '@/library/cloud.js'
import { saveUseRuntimeConfigFunction, awaitDoorPromises } from '@/library/door.js'


export default defineEventHandler(async (event) => {
	let o = {}
	try {
		saveUseRuntimeConfigFunction(useRuntimeConfig)


		let body = await readBody(event)
		log('body is:', look(body))

		o.message = 'hi from api count'
		o.mirroredBody = body



		//create the row if it doesn't exist
		if (!(await rowExistsBetter())) {
			await createRowBetter()
			log("row didn't exist, created it")
		}



		//increment
		let countGlobal = 0
		if (body.countGlobal > 0) {
			log('need to increment the count')

			countGlobal = +(await readRowBetter())//read, convert string to int afterards
			countGlobal += body.countGlobal//increment with requested value
			await writeRowBetter(countGlobal+'')//write, convert int to string beforehand

			log('incremented to ' + countGlobal)
		}

		//read
		countGlobal = +(await readRowBetter())//read or read again to check, convert string to int afterards


		o.countGlobal = countGlobal
		o.countBrowser = 0
		o.count1 = countGlobal
		o.count2 = 0
		o.message = 'hello from cold3 api count'


	} catch (e) {
		logAlert('count2 caught', {e})
	}
	await awaitDoorPromises()
	return o
})






