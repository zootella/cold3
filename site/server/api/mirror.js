
import {
Now, Tag,
getAccess,
doorWorker,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body}) {
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
