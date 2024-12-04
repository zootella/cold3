
import {
Sticker, doorWorker, Now, getAccess,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {

	let t = Now()
	let lambdaNote = (await $fetch(
		Sticker().isCloud ? 'https://api.net23.cc/ping5' : 'http://localhost:4000/prod/ping5',
		{method: 'POST', body: {ACCESS_NETWORK_23_SECRET: (await getAccess()).get('ACCESS_NETWORK_23_SECRET')}
		})).note
	let duration = Now() - t

	return {note: `worker says: lambda took ${duration}ms to say: ${lambdaNote}`}
}
