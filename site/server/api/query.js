
import {
Sticker,
log, look, Now, Tag, getAccess, checkText, textToInt,
doorWorker,
dog,
snippetClear, snippetPopulate, snippetQuery,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}

	let action = door.body.action
	let result
	switch (action) {
		case 'Clear.':    result = await snippetClear();    break;
		case 'Populate.': result = await snippetPopulate(); break;
		case 'Query.':    result = await snippetQuery();    break;
		default: toss('action', {door}); break;
	}

	o.sticker = Sticker().all
	o.result = result
	return o
}
