
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

	o = {
		sticker: Sticker().all,
		message: 'hi from api query',
		action: door.body.action,
	}

	return o
}
