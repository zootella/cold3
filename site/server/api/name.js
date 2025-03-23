
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

	//ttd march, so actually do the database query, why don't you
	//validate, and return "NameNotValid.", "NameAvailable.", or "NameTaken."
	//don't validate on the client component at this time, as right now the focus is turnstile in a button
	log(`api name got name "${body.name}"`)

	r.note = `turnstile good!; name api will check "${body.name}" in ${Sticker().all}`
	return r
}
