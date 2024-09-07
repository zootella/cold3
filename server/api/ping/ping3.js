
import { pingTime, pingEnvironment, pingVersion } from '@/library/ping.js'


export default defineEventHandler((event) => {
	let note = ''
	try {





		note = `${pingTime()}, ${pingEnvironment()}, ${pingVersion()}, ping3done`

	} catch (e) { note = 'ping4error: '+e.stack }
	return {note}
})
