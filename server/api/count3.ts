
import {
log, look,
accessWorker,
rowExists, createRow, readRow, writeRow,
} from '@/library/grand.js'


export default defineEventHandler(async (workerEvent) => {
	let o = {}
	try {
		accessWorker({workerEvent, useRuntimeConfig})

		//no, you have to import stuff manually for the api
		//log('compostable on server? ' + typeof utility1)


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
		//log('count caught: ', e)
	}
	return o;
});






