
import {
Sticker, isCloud,
log, look, Now, Tag, getAccess, checkText, textToInt,
doorWorker,
dog,
snippetClear, snippetPopulate, snippetQuery2, snippetQuery3,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let r = {}
	if (isCloud({uncertain: 'Cloud.'})) toss('where', {door})//this endpoint is only for local development

	let result
	switch (action) {
		case 'Clear.':    result = await snippetClear();    break;
		case 'Populate.': result = await snippetPopulate(); break;
		case 'Query2.':   result = await snippetQuery2();   break;
		case 'Query3.':   result = await snippetQuery3();   break;
		default: toss('action', {door}); break;
	}

	r.sticker = Sticker().all
	r.result = result
	return r
}
