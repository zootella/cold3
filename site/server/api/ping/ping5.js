
import {
host23,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body}) {

	let t = Now()
	let lambdaNote = (await $fetch(
		host23() + '/ping5',
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
