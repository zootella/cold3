
import { seal } from '../../library/ping.js'


export const handler = async (event) => {
	let note = ''
	try {





		note = `lambda says: ${seal().w3}, ping5done`

	} catch (e) { note = 'ping5 lambda error: '+e.stack }
	return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({note}) }
}
