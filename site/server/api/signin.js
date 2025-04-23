
export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Hi.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {
	let r = {}
	r.sticker = Sticker().all

	switch (action) {
		case 'Hi.': r.result = 'hello back to you'; break;
		/*
		case 'SignGet.': r.result = await signGet({browserHash}); break;
		case 'SignIn.':  r.result = await signIn({browserHash, userTag: body.userTag}); break;
		case 'SignOut.': r.result = await signOut({browserHash, userTag: body.userTag}); break;
		*/
	}

	return r
}
