
import {
log, see,
accessWorkerEvent,
} from '@/library/grand.js'


export default defineEventHandler(async (workerEvent) => {
	let o = {}
	try {
		accessWorkerEvent(workerEvent)


		log('hi from the chat api')



	} catch (e) {
		log('chat api caught: ', e)
	}
	return o
})






