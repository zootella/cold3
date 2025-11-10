//./server/api/totp.js
import {
browserToUser, trailAdd, secureSameText,
credentialPasswordGet, credentialPasswordCreate, credentialPasswordRemove,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Status.', 'Set.', 'Validate.', 'Remove.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {

	//collect information from the database
	let user, password
	user = await browserToUser({browserHash})//what user is signed in at the browser talking to us
	if (!user) return {outcome: 'BadNoUser.'}
	password = await credentialPasswordGet({userTag: user.userTag})
	log('found password', look(password))

	//status check on component load
	if (action == 'Status.') {

		if (password) return {outcome: 'StatusPasswordProtected.', cycles: password.cycles}
		return {outcome: 'StatusNoPassword.'}

	} else if (action == 'Set.') {

		await credentialPasswordCreate({userTag: user.userTag, hash: body.hash, cycles: body.cycles})
		return {outcome: 'PasswordSet.'}

	} else if (action == 'Validate.') {
		if (!password) toss('state')

		let valid = secureSameText(password.hash, body.hash)
		if (valid) {

			await trailAdd(//maybe use later to detect a stale password, ttd november
				`Password validation on hash ${password.hash}`
			)
			return {outcome: 'Correct.'}

		} else {

			await trailAdd(//maybe use later to rate limit wrong guesses, ttd november
				`Password wrong guess on hash ${password.hash}`
			)
			return {outcome: 'Wrong.'}
		}

	} else if (action == 'Remove.') {

		await credentialPasswordRemove({userTag: user.userTag})
		return {outcome: 'PasswordRemoved.'}
	}
}
