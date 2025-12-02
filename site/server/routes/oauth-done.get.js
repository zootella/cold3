//./server/routes/oauth-done.get.js

import {
isExpired,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('GET', {workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, query, browserHash}) {

	let letter = await openEnvelope('OauthDone.', query.envelope)//oauth envelope [4] open done
	log('letter arrived in worker 📩', look(letter))
	//now we'll save the proven credential in the database
	//and below, choose what route to send the user to, ttd november

	return sendRedirect(door.workerEvent, '/', 302)
}
