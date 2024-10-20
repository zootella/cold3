
import {
Sticker, log, look, Now, Tag,
doorWorkerOpen, doorWorkerShut,
dog, awaitLogAlert
} from '@/library/grand.js'

export default defineEventHandler(async (workerEvent) => {
	let door = {}, response, error
	try {

		//CHECKPOINT 1
		//dog('checkpoint 1')

		door = await doorWorkerOpen(workerEvent, useRuntimeConfig)
		response = await doorProcessBelow(door)

	} catch (e) { error = e }
	try {

		//CHECKPOINT 3
		//dog('checkpoint 3')

		let r = await doorWorkerShut(door, response, error)
		if (response && !error) return r

	} catch (f) { await awaitLogAlert('door shut', {f, door, response, error}) }
	setResponseStatus(workerEvent, 500); return null
})
//^our copypasta to safely man the front door

/*
export default new_design_defineEventHandler(async (workerEvent) => {
	return doorWorker(workerEvent, useRuntimeConfig, doorProcessBelow)
})
//^october DUH DUH DUH this is all it needs to be, DUH (new design for door with three line boilerplate)
*/

async function doorProcessBelow(door) {
	let response = {}

	//CHECKPOINT 2
	dog('door worker')
	//blowup1()

	//prove you got the body by including in message
	let message = `hello ${door.body.name} age ${door.body.age} from door ${Sticker().all}`

	response.message = message
	response.when = Now()
	return response
}




function blowup1() {
	blowup2()
}
function blowup2() {
	blowup3()
}
function blowup3() {
	let o = {}
	o.notHere.blowupBeyond
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






















































