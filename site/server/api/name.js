
import {
log, look, toss, doorWorker, Sticker, getAccess,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}
	let access = await getAccess()
	log('hi in server api name.js; we got the turnstile token '+door.body.turnstileToken)

	let turnstileResponse = await $fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			secret: access.get('ACCESS_TURNSTILE_SECRET'),
			response: door.body.turnstileToken
		})
	})
	if (!turnstileResponse.success) toss('turnstile non success', {door})//turnstile token not valid

	o.note = `turnstile good!; name api will check "${door.body.name}" in ${Sticker().all}`
	return o
}
