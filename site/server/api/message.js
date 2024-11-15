
import {
log, look, Now, Tag,
doorWorker, accessWorker, awaitDoorPromises,
dog,
Sticker, snippet,
fetchNetwork23,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker({workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}
	o.note = `worker message says: ${Sticker().all}, v2024nov14a`

	let path = '/message'
	let body = {...door.body, b2: 'in nuxt api message, added this'}


	let r = await fetchNetwork23($fetch, 'AE', path, body)
	o.network23Response = r





	return o
}


