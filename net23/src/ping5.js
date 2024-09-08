
import { pingTime, pingEnvironment, pingVersion } from '../../library/ping.js'


export const handler = async (event) => {
	let note = ''
	try {





		note = `lambda ${pingTime()}, ${pingEnvironment()}, ${pingVersion()}, ping5done`

	} catch (e) { note = 'ping5 lambda error: '+e.stack }
	return { statusCode: 200, body: JSON.stringify({note}) }
}
