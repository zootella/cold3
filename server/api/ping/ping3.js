
import { sticker } from '@/library/sticker.js'


export default defineEventHandler((event) => {
	let note = ''
	try {





		note = `worker says: ${sticker().all}, ping3done`

	} catch (e) { note = 'ping3 worker error: '+e.stack }
	return {note}
})
