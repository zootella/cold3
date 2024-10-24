
import {
Sticker,
log, look, Now, Tag, getAccess, checkText,
doorWorker,
dog, logAlert, awaitLogAlert,
rowExists, createRow, readRow, writeRow,
} from '@/library/grand.js'

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker({workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}

	o.message = 'hi from api count2d!'
	o.mirroredBody = door.body

	//create the row if it doesn't exist
	if (!(await rowExists())) {
		await createRow()
	}

	//increment
	let countGlobal = 0
	if (door.body.countGlobal > 0) {
		countGlobal = +(await readRow())//read, convert string to int afterards
		countGlobal += door.body.countGlobal//increment with requested value
		await writeRow(countGlobal+'')//write, convert int to string beforehand
	}

	//read
	countGlobal = +(await readRow())//read or read again to check, convert string to int afterards

	o.countGlobal = countGlobal
	o.countBrowser = 0
	o.count1 = countGlobal
	o.count2 = 0

	return o
}
