
import {
Now, Tag, Sticker,
getAccess,
doorWorker,
} from '@/library/grand.js'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker({workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let access = await getAccess()
	let o = {}

	o.message = 'hello from cold3 api mirror, version 2024oct8b'
	o.serverTick = Now()
	o.headers = door.workerEvent.req.headers
	o.accessLength = access.get('ACCESS_PASSWORD_SECRET').length
	o.tag = Tag()
	o.sayEnvironment = Sticker().all

	return o
}
