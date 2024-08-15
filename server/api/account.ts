
import { log, inspect } from '../../library/library0.js'

export default defineEventHandler(async (event) => {
	let o = {}
	try {
		let body = await readBody(event)



		o.message = 'hi from api account, version 2024aug15a'
		o.access = body.password == process.env.ACCESS_PASSWORD ? 'granted' : 'denied'


	} catch (e) {
		log('api account caught: ', e)
		//TODO maybe return 400 bad request or 500 internal error or something?
		//and also log this to datadog or something
	}
	return o
})
