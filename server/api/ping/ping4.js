
import { Sticker } from '@/library/sticker.js'
import { addAccessSource, database_pingCount } from '@/library/grand.js'

export default defineEventHandler(async (event) => {
	let note = ''
	try {

		let t = Date.now()
		addAccessSource('nuxt', useRuntimeConfig())
		let count = await database_pingCount()
		let duration = Date.now() - t

		note = `worker says: database took ${duration}ms to get count ${count}, ${Sticker().all}, ping4done`

	} catch (e) { note = 'ping4 worker error: '+e.stack }
	return {note}
})
