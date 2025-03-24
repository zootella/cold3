
import {
log, look, toss, doorWorker, Sticker, dog, Now,
checkTurnstileToken,
validateName, nameCheck,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let r = {}
	r.sticker = Sticker().all

	//step 1 turnstile
	let t1 = Now()
	if (body.turnstileToken) {//ttd march, so obviously you won't make turnstile optional on an endpoint!
		await checkTurnstileToken(body.turnstileToken)
	}

	//step 2 check what the page posted
	let t2 = Now()
	let v = validateName(body.name)
	if (!v.isValid) toss('not valid')//the page shouldn't be able to submit a name that we don't like, we're using the same validator!

	//step 3 check the database for uniqueness
	r.available = await nameCheck({v})
	let t3 = Now()
	r.duration = `took ${t2 - t1}ms turnstile, then ${t3 - t2}ms database`
	return r
}
