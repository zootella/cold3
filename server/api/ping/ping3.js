
import { pingEnvironment } from '@/library/ping.js'


export default defineEventHandler((event) => {
	let note = ''
	try {





		note = `worker ${pingEnvironment()}, ping3done`

	} catch (e) { note = 'ping3 worker error: '+e.stack }
	return {note}
})
