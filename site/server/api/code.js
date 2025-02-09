
import {
log, look, checkTag,
doorWorker, getAccess,
legacyAccessSet, legacyAccessGet,
timeSafeEqual,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}

	o.message = 'api code, version 2025feb9a'
	o.note = 'none'

	//first, validate what the untrusted client told us
	checkTag(door.body.browserTag)


	return o
}
