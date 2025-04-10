
import {
snippetClear, snippetPopulate, snippetQuery2, snippetQuery3,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Hi.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let r = {}
	r.sticker = Sticker().all

	switch (action) {
		case 'Hi.': r.result = 'hello back to you'; break;
		/*
		case 'SignGet.': r.result = await signGet({browserTag: body.browserTag}); break;
		case 'SignIn.':  r.result = await signIn({browserTag: body.browserTag, userTag: body.userTag}); break;
		case 'SignOut.': r.result = await signOut({browserTag: body.browserTag, userTag: body.userTag}); break;
		*/
	}

	return r
}
