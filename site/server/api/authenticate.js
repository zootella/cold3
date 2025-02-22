
import {
Sticker, isCloud,
log, look, toss, Now, Tag, getAccess, checkText, textToInt,
doorWorker,
dog,
snippetClear, snippetPopulate, snippetQuery2, snippetQuery3,
demonstrationSignGet, demonstrationSignUp, demonstrationSignIn, demonstrationSignOut,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let r = {}
	r.sticker = Sticker().all

	switch (action) {
		case 'DemonstrationSignGet.': r.result = await demonstrationSignGet({browserTag: body.browserTag});                        break;
		case 'DemonstrationSignUp.':  r.result = await demonstrationSignUp({browserTag:  body.browserTag, nameRaw: body.nameRaw}); break;
		case 'DemonstrationSignIn.':  r.result = await demonstrationSignIn({browserTag:  body.browserTag, nameRaw: body.nameRaw}); break;
		case 'DemonstrationSignOut.': r.result = await demonstrationSignOut({browserTag: body.browserTag});                        break;
		default: toss('action', {door}); break;
	}

	return r
}
