
import { log, look, toss } from '@/library/library0.js'
import { dog, flare, actualLogflareLog, actualDatadogLog } from '@/library/cloud2.js'

export default defineEventHandler(async (event) => {
	let o = {}
	try {

		let body = await readBody(event)

		let message = body.message
		await dog(message)
		await flare(message)

		o.message = 'hi from api log'
		o.mirroredBody = body
		setResponseStatus(event, 200)
	} catch (e) {
		log('count caught: ', e)
		setResponseStatus(event, 500)
	}
	return o
})




























