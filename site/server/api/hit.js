
import {
Sticker, doorWorker, dog,
log, look, Now, Tag, checkText, textToInt,
database_countRows, database_addRow, database_updateCell, database_getRow, database_getRows,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}

	/*
	let row = await database_getRow('settings_table', 'key_text', 'count')
	log(look(row))
	*/
	/*
	{
		key_text: "count"
		value_text: "1119"
	}
	*/

	/*
	bookmark january
	next, run below to see how it gives you multiple rows

	let row = await database_getRows('access_table', 'browser_tag', 'mUI301FUXDWTtgwq4eSGz')
	log(look(row))
	*/



	return o
}
