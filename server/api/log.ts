
import { log, inspect, toss } from '../../library/library0.js'
import { logCloud } from '../../library/library2.js'

export default defineEventHandler(async (event) => {
	let o = {}
	try {

		let body = await readBody(event)
		log('log api version 8')

		let message = body.message
		logCloud(message)

		o.message = 'hi from api log'
		o.mirroredBody = body
		setResponseStatus(event, 200)
	} catch (e) {
		log('count caught: ', e)
		setResponseStatus(event, 500)
	}
	return o
})




























