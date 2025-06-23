
import {
browserToUser, browserToCodes,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, headers, browserHash}) {
	let task = Task({name: 'load api'})//while this is written as a regular endpoint, this happens once for a new tab's GET as part of the server render

	//look stuff up for this browser
	task.user  = await browserToUser({browserHash})
	task.codes = await browserToCodes({browserHash})
	/*
	more steps here will probably be like:
	if (task.user.userTag) {
		task.feed = await userToFeed({userTag})
		//and more stuff for a user we know about
	}
	*/
	task.finish({success: true})
	return task
}
