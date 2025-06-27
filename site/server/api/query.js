
import {
snippetClear, snippetPopulate, snippetQuery2, snippetQuery3,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Clear.', 'Populate.', 'Query2.', 'Query3.'], workerEvent, doorHandleBelow})
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
	}

	r.sticker = Sticker()
	r.result = result
	return r
}
