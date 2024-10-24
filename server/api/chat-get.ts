
import {
log, see,
accessWorker,
} from '@/library/grand.js'


export default defineEventHandler(async (workerEvent) => {
	let o = {}
	try {
		accessWorker({workerEvent, useRuntimeConfig})


		log('hi from the chat api')



	} catch (e) {
		log('chat api caught: ', e)
	}
	return o
})






