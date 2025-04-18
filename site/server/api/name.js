//./server/api/name.js
import {
validateName, nameCheck,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	//[~] errorspot, page gets a 500 but server gets an error that doesn't hit a handler :( but it doesn't matter because you've got a try catch around the whole body of door worker so you should be ok
	return await doorWorker('POST', {useTurnstile: true, actions: ['Check.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body}) {
	//[x]errorspot, caught by door worker shut, not the new plugin handlers, but that's fine
	let v = validateName(body.name)
	if (!v.isValid) toss('valid', {body, v})

	return await nameCheck({v})
}
