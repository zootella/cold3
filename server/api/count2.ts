
import { createClient } from '@supabase/supabase-js'
import {
log, look,
rowExists, createRow, readRow, writeRow,
dog, logAlert,
accessWorkerEvent, awaitDoorPromises,
} from '@/library/grand.js'


export default defineEventHandler(async (workerEvent) => {
	let o = {}
	try {
		accessWorkerEvent(workerEvent)


		let body = await readBody(workerEvent)
		//log('body is:', look(body))

		o.message = 'hi from api count'
		o.mirroredBody = body



		//create the row if it doesn't exist
		if (!(await rowExists())) {
			await createRow()
			//log("row didn't exist, created it")
		}



		//increment
		let countGlobal = 0
		if (body.countGlobal > 0) {
			//log('need to increment the count')

			countGlobal = +(await readRow())//read, convert string to int afterards
			countGlobal += body.countGlobal//increment with requested value
			await writeRow(countGlobal+'')//write, convert int to string beforehand

			//log('incremented to ' + countGlobal)
		}

		//read
		countGlobal = +(await readRow())//read or read again to check, convert string to int afterards


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






