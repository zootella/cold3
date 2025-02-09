
import {
log, look, checkTag,
doorWorker, getAccess,
legacyAccessSet, legacyAccessGet,
timeSafeEqual,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {//will become ({door, body, action})
	let o = {}

	const body = door.body
	const action = door.body.action

	//first, validate what the untrusted client told us
	checkTag(body.browserTag)
	checkPhone(body.phone)
	checkAction(action, ['Send.'])//list of acceptable actions

	o.message = 'api code, version 2025feb9a'
	o.note = 'none'

	//here you should look up user tag--is there like a pinia store on the server so you don't look it up twice or something?
	let userTag = Tag()//temporary, obviously

	checkTag(userTag)

			browserTag: helloStore.browserTag,
			userTag: helloStore.userTag,
			phone: refPhone.value,


	if (action == 'Send.') {
		log("fine, we'll send a code")
	} else { toss('action', {door}) }


	return o
}
