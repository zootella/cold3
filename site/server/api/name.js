//./server/api/name.js
import {
validateName, nameCheck,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	//[] errorspot, event handler function that gets called only from a page
	return await doorWorker('POST', {useTurnstile: true, actions: ['Check.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body}) {
	let v = validateName(body.name)
	if (!v.isValid) toss('valid', {body, v})

	return await nameCheck({v})
}
