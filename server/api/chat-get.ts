
import {
log, see
} from '@/library/grand.js'


export default defineEventHandler(async (event) => {
	let o = {}
	try {


		log('hi from the chat api')



	} catch (e) {
		log('chat api caught: ', e)
	}
	return o
})






