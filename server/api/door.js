
import { Sticker } from '../../library/sticker.js'
import { log, look, Now } from '@/library/library0.js'
import { Tag } from '@/library/library1.js'
import { doorWorkerOpen, doorWorkerShut } from '@/library/door.js'
import { dog, awaitLogAlert, awaitLogFragile } from '@/library/cloud.js'

export default defineEventHandler(async (workerEvent) => {
	let door = {}, response, error
	try {

		//CHECKPOINT 1
		dog('checkpoint 1')

		door = await doorWorkerOpen(workerEvent)
		response = await doorProcessBelow(door)

	} catch (e) { error = e }
	try {

		//CHECKPOINT 3
		dog('checkpoint 3')

		let r = await doorWorkerShut(door, response, error)
		if (response && !error) return r

	} catch (f) { await awaitLogFragile('door shut', {f, door, response, error}) }//change to awaitLogAlert
	setResponseStatus(workerEvent, 500); return null
})
//^our copypasta to safely man the front door

async function doorProcessBelow(door) {
	let response = {}

	//CHECKPOINT 2
	dog('checkpoint 2')

	//prove you got the body by including in message
	let message = `hello ${door.body.name} age ${door.body.age} from door ${Sticker().all}`

	response.message = message
	response.when = Now()
	return response
}















/*
doorProcessBelow just returns a js object which should be the response body
or, returns nothing if there is no response body
or throws if something happened wrong

let's call this return processResult

then doorShut needs to turn this into what the cloud handler wants

//lambda
		if (response && !error) return { statusCode: 200, headers: {'Content-Type': 'application/json'}, body: response.bodyStringified }
//worker
		if (response && !error) return response.body

lambda makes you put in the status code, headers, and stringify the body
nuxt just wants the js body, before stringification

the place to handle this difference is doorShut, of course

whta about just

return await doorWorkerShut(door, response, error)


*/






















































