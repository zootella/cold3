//./server/api/name.js
import {
validateName, nameCheck,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {useTurnstile: true, actions: ['Check.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body}) {
	let v = validateName(body.name)
	if (!v.isValid) toss('valid', {body, v})

	dog(`name.js got "${body.name}"`)//ttd april, checking datadog locally

	return await nameCheck({v})
}
