//./server/routes/oauth-done.get.js

import {
encryptSymmetric,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('GET', {workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, query, browserHash}) {

	let symmetric = encryptSymmetric(Key('envelope, secret'))
	let letter = await symmetric.decryptObject(query.envelope)
	log('ok, got the letter from the sveltekit side here in nuxt at last!!', look(letter))

	return sendRedirect(door.workerEvent, '/', 302)
}
