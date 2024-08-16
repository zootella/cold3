
import { log, inspect, checkHash, checkText } from '../../library/library0.js'
import { checkTag } from '../../library/library1.js'
import { accessInsert, accessQuery } from '../../library/database.js'

export default defineEventHandler(async (event) => {
	let o = {}
	try {
		let body = await readBody(event)
		o.message = 'hi from api account, version 2024aug15d'

		//first, validate what the untrusted client told us
		checkHash(body.browserHash)
		checkText(body.password)//throws on blank rather than denied, but for this example, that's ok

		//validate the password
		let passwordValid = (body.password == process.env.ACCESS_PASSWORD)
		o.access = passwordValid ? 'granted' : 'denied'

		//is this browser already signed in?
		let rows = await accessQuery(body.browserHash)
		log(rows.length)
		log(inspect(rows[0]))
		log(inspect(rows[1]))
		log(inspect(rows[2]))

		o.rows = rows

		/*
		ok, you're getting three rows back, which is great
		for now, just look at the last one
		*/

		/*
		you just realized
		only sign in requires a valid password
		*/



	} catch (e) {
		log('api account caught: ', e)
		//TODO maybe return 400 bad request or 500 internal error or something?
		//and also log this to datadog or something
	}
	return o
})

async function accessCheck(browserHash) {
	return await accessQuery(browserHash)

}

async function accessIn(browserHash) {
	return await accessInsert(browserHash, 1)

}
async function accessOut(browserHash) {
	return await accessInsert(browserHash, 0)

}

/*
there needs to be server side logic so if the user is already signed in our out, they can't duplicate that
and also gray out buttons on the page

*/

