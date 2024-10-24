
import {
log, look, toss, Now, accessWorkerEvent,
} from '@/library/grand.js'

export default defineEventHandler(async (workerEvent) => {
	let o = {}
	try {
		accessWorkerEvent(workerEvent)

		let body = await readBody(workerEvent)

		let message = body.message
		let t = Now()
		//await dog(message)
		let duration = Now() - t

		//snippet2()

		o.message = 'hi from api log'
		o.mirroredBody = body
		o.duration = duration//how long it took to await for datadog
		setResponseStatus(workerEvent, 200)
	} catch (e) {
		log('count caught: ', e)
		setResponseStatus(workerEvent, 500)
	}
	return o
})




























