//./server/routes/oauth-done.get.js

import {
isExpired,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('GET', {workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, browserHash, query, letter}) {
	if (letter.action != 'OauthDone.') toss('envelope has wrong action')
	if (isExpired(letter.expiration)) toss('expired')//oauth envelope done: expiration check [4]

	log('letter arrived in worker 📩', look(letter))
	//now we'll save the proven credential in the database
	//and below, choose what route to send the user to, ttd november

	return sendRedirect(door.workerEvent, '/', 302)
}
