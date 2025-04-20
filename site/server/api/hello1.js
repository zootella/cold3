
import {
browserToUserTag,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, browserTag}) {
	let r = {}
	r.sticker = Sticker().all

	r.user = await browserToUserTag({browserTag})

	/*
	/api/hello1

	really fast, in a single database call, determine if the given browserTag has a signed-in user or not
	the whole tab is waiting on this to choose which components to render
	we don't really need any information about the user, even
	*/

	return r
}
