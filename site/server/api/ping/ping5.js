
import {
Sticker, doorWorker, Now, getAccess, urlNetwork23,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {

	let t = Now()
	let lambdaNote = (await $fetch(
		urlNetwork23() + '/ping5',
		{
			method: 'POST',
			body: {
				ACCESS_NETWORK_23_SECRET: (await getAccess()).get('ACCESS_NETWORK_23_SECRET')
			}
		}
	)).note
	let duration = Now() - t

	return {note: `worker says: lambda took ${duration}ms to say: ${lambdaNote}`}
}
