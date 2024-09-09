
import { pingTime, pingEnvironment, pingVersion } from '../../library/ping.js'




import { log } from '../../library/library0.js'
import { Tag } from '../../library/library1.js'
import { senseEnvironment } from '../../library/library2.js'
import { actualLogflareLog } from '../../library/cloud2.js'









export const handler = async (event) => {
	let note = ''
	try {





		note = `lambda ${pingTime()}, ${pingEnvironment()}, ${pingVersion()}, ping5done`


note += ` ${senseEnvironment()}`
console.log(note)

	} catch (e) { note = 'ping5 lambda error: '+e.stack }
	return { statusCode: 200, body: JSON.stringify({note}) }
}
