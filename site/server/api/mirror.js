
import {
Now, Tag, Sticker,
getAccess,
doorWorker,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let access = await getAccess()
	let r = {}

	r.message = 'hello from cold3 api mirror, version 2024oct8b'
	r.serverTick = Now()
	r.headers = door.workerEvent.req.headers
	r.accessLength = access.get('ACCESS_PASSWORD_SECRET').length
	r.tag = Tag()
	r.sayEnvironment = Sticker().all

	return r
}
