
import {
Sticker, log, look, Now, Tag, getAccess, checkText,
doorWorker,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('GET', {workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow})
})
async function doorHandleBelow({door}) {












	let r = {}
	r.name = 'rgw'
	r.sticker = Sticker().all
	r.method = door.workerEvent.req.method
	r.headers = door.workerEvent.req.headers


	return r
}
