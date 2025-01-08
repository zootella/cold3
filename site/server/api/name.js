
import {
log, look, toss, doorWorker, Sticker,
checkTurnstileToken,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}
	log('hi in server api name.js; we got the turnstile token '+door.body.turnstileToken)

	await checkTurnstileToken(door.body.turnstileToken)

	o.note = `turnstile good!; name api will check "${door.body.name}" in ${Sticker().all}`
	return o
}
