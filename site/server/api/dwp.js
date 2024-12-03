
import {
Sticker, log, look, Now, Tag, getAccess, checkText,
doorWorker,
dog,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let response = {}

	let message = `${door.body.name}.${door.body.quantity}.${door.body.condition} from ${Sticker().all}`

	response.message = message
	response.when = Now()
	return response
}
