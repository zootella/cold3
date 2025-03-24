

import {
Sticker, isLocal, isCloud, log, look, urlNetwork23,
Now, Tag, getAccess, checkText,
doorWorker,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let r = {}

	let message = `${body.name}.${body.quantity}.${body.condition} from ${Sticker().all}`

	r.message = message
	r.when = Now()
	return r
}
