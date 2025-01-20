
import {
Sticker,
log, look, Now, Tag, getAccess, checkText, textToInt,
doorWorker,
dog,
countGlobal_rowExists, countGlobal_createRow, countGlobal_readRow, countGlobal_writeRow,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}

	o.message = 'hi from api count'
	o.mirroredBody = door.body

	//create the row if it doesn't exist
	if (!(await countGlobal_rowExists())) {
		await countGlobal_createRow()
	}

	//increment
	let countGlobal = 0
	if (door.body.countGlobal > 0) {
		countGlobal = textToInt(await countGlobal_readRow())//read, convert string to int afterards
		countGlobal += door.body.countGlobal//increment with requested value
		await countGlobal_writeRow(countGlobal+'')//write, convert int to string beforehand
	}

	//read
	countGlobal = +(await countGlobal_readRow())//read or read again to check, convert string to int afterards

	o.countGlobal = countGlobal
	o.countBrowser = 0
	o.count1 = countGlobal
	o.count2 = 0

	return o
}
