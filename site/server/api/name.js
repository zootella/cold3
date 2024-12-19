
import {
log, look, toss, doorWorker, Sticker,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}

	o.note = `name api will check "${door.body.name}" in ${Sticker().all}`

	return o
}
