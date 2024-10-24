
import {
log, see, Now, look, Tag, Sticker,
accessWorker, getAccess, awaitDoorPromises,
} from '@/library/grand.js'

export default defineEventHandler(async (workerEvent) => {
	accessWorker({workerEvent, useRuntimeConfig})
	let access = await getAccess()

	let o = {}
	o.message = 'hello from cold3 api mirror, version 2024oct8b'
	o.serverTick = Now()
	o.headers = workerEvent.req.headers
	o.accessLength = access.get('ACCESS_PASSWORD_SECRET').length
	o.tag = Tag()
	o.sayEnvironment = Sticker().all
	await awaitDoorPromises()
	return o
})

