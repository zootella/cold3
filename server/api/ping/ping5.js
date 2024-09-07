
import { pingTime, pingEnvironment, pingVersion } from '@/library/ping.js'

export default defineEventHandler((event) => {
	return {
		note: `${pingTime()}, ${pingEnvironment()}, ${pingVersion()}, ping5done`
	}
})
