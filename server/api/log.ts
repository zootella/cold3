
import {
log, look, toss, Now
} from '@/library/grand.js'

export default defineEventHandler(async (event) => {
	//saveCloudEvent(event)
	let o = {}
	try {

		let body = await readBody(event)

		let message = body.message
		let t = Now()
		//await dog(message)
		let duration = Now() - t

		//snippet2()

		o.message = 'hi from api log'
		o.mirroredBody = body
		o.duration = duration//how long it took to await for datadog
		setResponseStatus(event, 200)
	} catch (e) {
		log('count caught: ', e)
		setResponseStatus(event, 500)
	}
	return o
})




























