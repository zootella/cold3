
import {
Sticker, log, look, Now, Tag, getAccess, checkText,
doorWorker,
dog,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('GET', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}
	o.name = 'rgw'
	o.sticker = Sticker().all
	o.method = door.workerEvent.req.method
	o.headers = door.workerEvent.req.headers
	return o
}
