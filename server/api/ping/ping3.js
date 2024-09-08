
import { pingTime, pingEnvironment, pingVersion } from '@/library/ping.js'


export default defineEventHandler((event) => {
	let note = ''
	try {





		note = `worker ${pingTime()}, ${pingEnvironment()}, ${pingVersion()}, ping3done`

	} catch (e) { note = 'ping3 worker error: '+e.stack }
	return {note}
})
