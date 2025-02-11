
import {
Sticker, log, look, Now, Tag, getAccess, checkText, textToInt, doorWorker,
checkTag, settingReadInt, settingWrite, browserToUser,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let r = {}

	let browserTag = body.browserTag
	checkTag(browserTag)

	r.sticker = Sticker().all
	r.userTag = await browserToUser({browserTag})

	/*
	/api/hello1

	really fast, in a single database call, determine if the given browserTag has a signed-in user or not
	the whole tab is waiting on this to choose which components to render
	we don't really need any information about the user, even
	*/

	return r
}
