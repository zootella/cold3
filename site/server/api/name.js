
import {
log, look, toss, doorWorker, dog, Now,
checkTurnstileToken,
validateName, nameCheck,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {useTurnstile: true, actions: ['Check.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let r = {}
	r.sticker = Sticker().all

	//step 1 turnstile, door already did that for us

	//step 2 check what the page posted
	let t2 = Now()
	let v = validateName(body.name)
	if (!v.isValid) toss('not valid')//the page shouldn't be able to submit a name that we don't like, we're using the same validator!

	//step 3 check the database for uniqueness
	r.available = await nameCheck({v})
	let t3 = Now()
	r.duration = `took ${t2 - door.startTick}ms turnstile, then ${t3 - t2}ms database`
	return r
}
