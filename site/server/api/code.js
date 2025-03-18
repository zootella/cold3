
import {
log, look, Tag, checkTag,
doorWorker, getAccess,
secureSameText, checkAction, checkPhone,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let r = {}

	//first, validate what the untrusted client told us
	checkTag(body.browserTag)
	checkPhone(body.phone)
	checkAction(action, ['Send.'])//list of acceptable actions

	r.message = 'api code, version 2025feb9a'
	r.note = 'none'

	//here you should look up user tag--is there like a pinia store on the server so you don't look it up twice or something?
	let userTag = Tag()//temporary, obviously

	checkTag(userTag)


	if (action == 'Send.') {
		log("fine, we'll send a code")
	}


	return r
}
