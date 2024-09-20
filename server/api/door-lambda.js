
import { log, look, Now } from '@/library/library0.js'
import { Tag } from '@/library/library1.js'
import { doorWorkerOpen, doorWorkerShut } from '@/library/door.js'

export default defineEventHandler(async (workerEvent) => {
	let door = {}, response, error
	try {

		door = await doorWorkerOpen(workerEvent)
		response = await doorProcessBelow(door)

	} catch (e) { error = e }
	try {

		let workerReturn = await doorWorkerShut(door, response, error)
		if (response && !error) return workerReturn

	} catch (d) { console.error(`discarded ${Now()} ${Tag()}`, d) }
	setResponseStatus(workerEvent, 500); return null
})
//^our copypasta to safely man the front door

async function doorProcessBelow(door) {
	let response = {}


	let useNet23Cloud = false ? 'https://api.net23.cc/door' : 'http://localhost:4000/prod/door'

	let lambdaResult = await $fetch(useNet23Cloud, {
		method: 'POST',
		body: {
			ACCESS_NETWORK_23: process.env.ACCESS_NETWORK_23,
			name: 'bob',
			age: 42
		}})
	log(look(lambdaResult))
	let message = lambdaResult.message

	response.message = message
	response.when = Now()
	return response
}




/*

ping 5 worker to lambda:

export default defineEventHandler(async (event) => {
	let note = ''
	try {

		let t = Date.now()
		let lambdaNote = (await $fetch('https://api.net23.cc/ping5')).note
		let duration = Date.now() - t

		note = `worker says: lambda took ${duration}ms to say: ${lambdaNote}`

	} catch (e) { note = 'ping5 worker error: '+e.stack }
	return {note}
})

ping 5 lambda:



import { pingEnvironment } from '../../library/ping.js'


export const handler = async (event) => {
	let note = ''
	try {





		note = `lambda says: ${pingEnvironment()}, ping5done`

	} catch (e) { note = 'ping5 lambda error: '+e.stack }
	return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({note}) }
}


*/












