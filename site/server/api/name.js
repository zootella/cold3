
import {
log, look, toss, doorWorker, Sticker, dog,
checkTurnstileToken,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let r = {}

	await checkTurnstileToken(body.turnstileToken)

	r.note = `turnstile good!; name api will check "${body.name}" in ${Sticker().all}`
	return r
}
