
import { pingTime, pingEnvironment, pingVersion } from '@/library/ping.js'

export default defineEventHandler(async (event) => {
	let note = ''
	try {

		let amazonTick = 6

		let t = Date.now()
		if (true) {
			let response = await $fetch('https://api.net23.cc/ping5', {method: 'POST'})
			amazonTick = response.tick
		}
		let duration = Date.now() - t

		note = `${pingTime()}, ${pingEnvironment()}, ${pingVersion()}, amazon tick ${amazonTick} in ${duration}ms, ping5done`

	} catch (e) { note = 'ping5error: '+e.stack }
	return {note}
})
















