
import {
log, look, toss, doorWorker, Sticker, dog,
checkTurnstileToken,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}

	await checkTurnstileToken(door.body.turnstileToken)

	o.note = `turnstile good!; name api will check "${door.body.name}" in ${Sticker().all}`
	return o
}
