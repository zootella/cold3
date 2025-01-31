
import {
Sticker, isCloud,
log, look, toss, Now, Tag, getAccess, checkText, textToInt,
doorWorker,
dog,
snippetClear, snippetPopulate, snippetQuery2, snippetQuery3,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}
	o.sticker = Sticker().all

	let action = door.body.action
	switch (action) {
		case 'Hi.': o.result = 'hello back to you'; break;
		/*
		case 'SignGet.': o.result = await signGet({browserTag: door.body.browserTag}); break;
		case 'SignIn.':  o.result = await signIn({browserTag: door.body.browserTag, userTag: door.body.userTag}); break;
		case 'SignOut.': o.result = await signOut({browserTag: door.body.browserTag, userTag: door.body.userTag}); break;
		*/
		default: toss('action', {door}); break;
	}

	return o
}
