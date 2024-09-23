
//import { senseEnvironment } from '../../library/ping.js'
import { log, look, Now } from '@/library/library0.js'
import { Tag } from '@/library/library1.js'
import { doorWorkerOpen, doorWorkerShut } from '@/library/door.js'
import { dog, logFragile } from '@/library/cloud.js'

export default defineEventHandler(async (workerEvent) => {
	let door = {}, response, error
	try {

		//BLOWUP 1
		await dog('checkpoint 1')
		function1()

		door = await doorWorkerOpen(workerEvent)
		response = await doorProcessBelow(door)

	} catch (e) { error = e }
	try {

		//BLOWUP 2
		await dog('checkpoint 3')

		let workerReturn = await doorWorkerShut(door, response, error)
		if (response && !error) return workerReturn

	} catch (d) { logFragile('door', {d, door, response, error}) }
	setResponseStatus(workerEvent, 500); return null
})
//^our copypasta to safely man the front door

async function doorProcessBelow(door) {
	let response = {}

	//BLOWUP 3
	await dog('checkpoint 2')

	//prove you got the body by including in message
	let message = `hello ${door.body.name} age ${door.body.age} from door v2024sep20a`


	response.message = message
	response.when = Now()
	return response
}





function function1() {
	function2()

}
function function2() {
	function3()
	
}
function function3() {
	let o = {}
	o.notHere.beyondThat
	
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






















































