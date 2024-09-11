
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
//^our copypasta to safely man the front door

async function doorProcessBelow(workerEvevnt, door) {

}





















