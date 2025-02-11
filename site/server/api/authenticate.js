
import {
Sticker, isCloud,
log, look, toss, Now, Tag, getAccess, checkText, textToInt,
doorWorker,
dog,
snippetClear, snippetPopulate, snippetQuery2, snippetQuery3,
authenticateSignGet, authenticateSignUp, authenticateSignIn, authenticateSignOut,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let r = {}
	r.sticker = Sticker().all

	switch (action) {
		case 'AuthenticateSignGet.': r.result = await authenticateSignGet({browserTag: body.browserTag}); break;
		case 'AuthenticateSignUp.':  r.result = await authenticateSignUp({browserTag: body.browserTag, routeText: body.userName}); break;
		case 'AuthenticateSignIn.':  r.result = await authenticateSignIn({browserTag: body.browserTag, routeText: body.userName}); break;
		case 'AuthenticateSignOut.': r.result = await authenticateSignOut({browserTag: body.browserTag}); break;
		default: toss('action', {door}); break;
	}

	return r
}
