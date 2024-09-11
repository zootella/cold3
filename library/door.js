
//oh, there's a knock at our front door!
//cloudflare has invoked a worker and sent an event for us to respond to a request using nuxt
//or, amazon has invoked a lambda and sent an event and context for us to respond

/* nuxt server api cloudflare worker copypasta:
import { Now } from '@/library/library0.js'
import { Tag } from '@/library/library1.js'
import { doorWorkerOpen, doorWorkerShut } from '@/library/door.js'

export default defineEventHandler(async (workerEvent) => {
	let door, response, error
	try {

		door = doorWorkerOpen(workerEvent)
		response = await doorProcessBelow(workerEvent, door)

	} catch (e) { error = e }
	try {

		await doorWorkerShut(workerEvent, door, response, error)
		if (response && !error) return response.body

	} catch (d) { console.error(`discarded ${Now()} ${Tag()}`, d) }
	setResponseStatus(workerEvent, 500); return null
})
//^our copypasta to safely man the door
*/

/* lambda copypasta:
exports.handler = async (lambdaEvent, lambdaContext) => {
	let door, response, error
	try {

		door = doorLambdaOpen(lambdaEvent)
		response = await doorProcessBelow(lambdaEvent, lambdaContext, door)

	} catch (e) { error = e }
	try {

		await doorLambdaShut(lambdaEvent, door, response, error)
		if (response && !error) return { statusCode: 200, headers: {'Content-Type': 'application/json'}, body: response.bodyStringified }

	} catch (d) { console.error(`discarded ${Now()} ${Tag()}`, d) }
	return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: null }
}
//^our copypasta to safely man the front door
*/

export function doorWorkerOpen(workerEvent) {}
export function doorLambdaOpen(lambdaEvent) {}
export async function doorWorkerShut(workerEvent, door, response, error) {}
export async function doorLambdaShut(lambdaEvent, door, response, error) {}


