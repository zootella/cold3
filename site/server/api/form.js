
import {
Sticker, log, look, toss, Tag, checkTag, checkText, Now,
doorWorker, getAccess,
secureSameText, checkAction, checkPhone,
demonstrationSignGet, validateEmailOrPhone,
fetch23,
Code, codeSend, codeEnter,
checkNumerals, settingReadInt,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let r = {}

	//first, validate what the untrusted client told us
	checkTag(body.browserTag)

	if (action == 'SubmitNote.') {

		const cycles = 20//do this a few times to be noticably slow
		let t = Now(), h
		for (let i = 0; i < cycles; i++) {
			h = await settingReadInt('hits', 0)
		}
		r.detail = `got hit count ${h} ${cycles} times in ${Now() - t}ms`

	} else { toss('action') }

	r.message = 'api form, version 2025mar22a'
	r.sticker = Sticker().all
	r.note = body.note
	r.noteLength = body.note.length
	return r
}
