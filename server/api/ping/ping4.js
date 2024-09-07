
import { pingTime, pingEnvironment, pingVersion } from '@/library/ping.js'
import { database_pingCount } from '@/library/database.js'

export default defineEventHandler(async (event) => {
	let note = ''
	try {

		let t = Date.now()
		let count = await database_pingCount()
		let duration = Date.now() - t

		note = `${pingTime()}, ${pingEnvironment()}, ${pingVersion()}, count ${count} in ${duration}ms, ping4done`

	} catch (e) { note = 'ping4error: '+e.stack }
	return {note}
})
