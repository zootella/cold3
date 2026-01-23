//./server/api/otp.js
import {
validateEmailOrPhone,
Code,
otpSend, otpEnter,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['FoundEnvelope.', 'SendTurnstile.', 'Enter.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {

	let letter//letter contains this browser's active code challenges, and gets passed cookie <--> page <--> server, down the stack
	if (hasText(body.envelope)) {
		letter = await openEnvelope('Otp.', body.envelope, {browserHash, skipExpirationCheck: true})//envelope must be authentic and browser hash must match; we skip the envelope expiration check because an old envelope can't contain young codes, and we filter old codes out next
	} else {
		letter = {otps: []}//letter with empty array for code below and deeper to look for existing challenges and add a new one
	}
	letter.otps = letter.otps.filter(o => Now() <= o.start + Code.expiration)//filter out expired challenges

	let task//each action below sets this task, which we return as the response body
	if (action == 'SendTurnstile.') {

		checkText(body.address)
		checkText(body.provider)
		let v = validateEmailOrPhone(body.address)
		if (!v.ok) toss('bad address', {body, v})
		let provider = body.provider.trim().toUpperCase().slice(0, 1)
		if      (provider == 'A') provider = 'Amazon.'
		else if (provider == 'T') provider = 'Twilio.'
		else toss('bad provider', {body, provider})
		task = await otpSend({browserHash, provider, v, letter})

	} else if (action == 'FoundEnvelope.') {

		task = Task({name: 'otp found envelope'})
		task.success = true

	} else if (action == 'Enter.') {

		checkTag(body.otpTag)
		checkNumerals(body.otpCandidate)
		task = await otpEnter({browserHash, letter, otpTag: body.otpTag, otpCandidate: body.otpCandidate})
	}

	if (letter.otps.length > 0) {//we have active challenges for this browser
		letter.browserHash = browserHash//prevent the letter we give it from being used elsewhere
		task.envelope = await sealEnvelope('Otp.', Limit.expirationUser, letter)//encrypt it for the browser to keep for up to 20 minutes in a cookie
	}
	task.otps = letter.otps.map(o => ({//prepare otps, the array of information about active challenges for the page to know and show
		tag: o.tag,
		start: o.start,
		f2: o.address.f2,//visual form for display on the page; vue derives letter from tag via hashToLetter, and type from f2 via validateEmailOrPhone
		//the letter, encrypted into the envelope, also includes o.answer, the correct answer; obviously we don't leak that to the page!
	}))
	task.finish()
	return task
}
