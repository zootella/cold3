
import { seal } from '@/library/ping.js'


export default defineEventHandler((event) => {
	let note = ''
	try {





		note = `worker says: ${seal().w3}, ping3done`

	} catch (e) { note = 'ping3 worker error: '+e.stack }
	return {note}
})
