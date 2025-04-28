
import {
browserToUser, browserToCodes,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, headers, browserHash}) {
	let task = Task({name: 'load api'})

	//look stuff up for this browser
	task.user  = await browserToUser({browserHash})
	task.codes = await browserToCodes({browserHash})
	task.finish({success: true})
	return task
}
