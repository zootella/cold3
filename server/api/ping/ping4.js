
import { pingEnvironment } from '@/library/ping.js'
import { database_pingCount } from '@/library/database.js'

export default defineEventHandler(async (event) => {
	let note = ''
	try {

		let t = Date.now()
		let count = await database_pingCount()
		let duration = Date.now() - t

		note = `worker says: database took ${duration}ms to get count ${count}, ${pingEnvironment()}, ping4done`

	} catch (e) { note = 'ping4 worker error: '+e.stack }
	return {note}
})
