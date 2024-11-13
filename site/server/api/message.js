
import {
log, look, Now, Tag,
doorWorker, accessWorker, awaitDoorPromises,
dog,
Sticker, snippet,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker({workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}
	o.note = `worker message says: ${Sticker().all}, v2024nov12a`

	return o
}


