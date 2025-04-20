
export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Hi.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserTag}) {
	let r = {}
	r.sticker = Sticker().all

	switch (action) {
		case 'Hi.': r.result = 'hello back to you'; break;
		/*
		case 'SignGet.': r.result = await signGet({browserTag}); break;
		case 'SignIn.':  r.result = await signIn({browserTag, userTag: body.userTag}); break;
		case 'SignOut.': r.result = await signOut({browserTag, userTag: body.userTag}); break;
		*/
	}

	return r
}
