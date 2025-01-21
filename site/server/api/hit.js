
import {
Sticker, doorWorker, dog,
log, look, Now, Tag, checkText, textToInt,
database_hit,
database_countRows, database_addRow, database_updateCell, database_getRow, database_getRows,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}

	await database_hit()

	return o
}
