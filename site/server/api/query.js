
import {
Sticker, isCloud,
log, look, Now, Tag, getAccess, checkText, textToInt,
doorWorker,
dog,
snippetClear, snippetPopulate, snippetQuery2, snippetQuery3,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}
	if (isCloud({uncertain: 'Cloud.'})) toss('where', {door})//this endpoint is only for local development

	let action = door.body.action
	let result
	switch (action) {
		case 'Clear.':    result = await snippetClear();    break;
		case 'Populate.': result = await snippetPopulate(); break;
		case 'Query2.':   result = await snippetQuery2();   break;
		case 'Query3.':   result = await snippetQuery3();   break;
		default: toss('action', {door}); break;
	}

	o.sticker = Sticker().all
	o.result = result
	return o
}
