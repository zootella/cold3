
import {
Sticker, isCloud,
log, look, toss, Now, Tag, getAccess, checkText, textToInt,
doorWorker,
dog,
snippetClear, snippetPopulate, snippetQuery2, snippetQuery3,
authenticateSignGet, authenticateSignUp, authenticateSignIn, authenticateSignOut,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}
	o.sticker = Sticker().all

	let action = door.body.action
	switch (action) {
		case 'AuthenticateSignGet.': o.result = await authenticateSignGet({browserTag: door.body.browserTag}); break;
		case 'AuthenticateSignUp.':  o.result = await authenticateSignUp({browserTag: door.body.browserTag, userName: door.body.userName}); break;
		case 'AuthenticateSignIn.':  o.result = await authenticateSignIn({browserTag: door.body.browserTag, userName: door.body.userName}); break;
		case 'AuthenticateSignOut.': o.result = await authenticateSignOut({browserTag: door.body.browserTag}); break;
		default: toss('action', {door}); break;
	}

	return o
}
