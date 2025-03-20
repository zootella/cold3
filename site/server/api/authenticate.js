
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

	//ttd march, ok,  you need to get the origin
	let origin = 'https://cold3.cc'//the origin should not have a trailing slash

	switch (action) {
		case 'DemonstrationSignGet.': r = await demonstrationSignGet({origin, browserTag: body.browserTag});                        break;
		case 'DemonstrationSignUp.':  r = await demonstrationSignUp({origin, browserTag:  body.browserTag, nameNormal: body.nameNormal}); break;
		case 'DemonstrationSignIn.':  r = await demonstrationSignIn({origin, browserTag:  body.browserTag, nameNormal: body.nameNormal}); break;
		case 'DemonstrationSignOut.': r = await demonstrationSignOut({origin, browserTag: body.browserTag});                        break;
		default: toss('action', {door}); break;
	}

	return r
}
