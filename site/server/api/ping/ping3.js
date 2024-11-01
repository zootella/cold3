
import { Sticker } from 'icarus'

export default defineEventHandler((workerEvent) => {
	let note = ''
	try {

		note = `worker says: ${Sticker().all}, ping3done`

	} catch (e) { note = 'ping3 worker error: '+e.stack }
	return {note}
})
