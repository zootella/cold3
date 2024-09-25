
import { Sticker } from '@/library/sticker.js'


export default defineEventHandler((event) => {
	let note = ''
	try {





		note = `worker says: ${Sticker().all}, ping3done`

	} catch (e) { note = 'ping3 worker error: '+e.stack }
	return {note}
})
