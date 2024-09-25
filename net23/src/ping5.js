
import { Sticker } from '../../library/sticker.js'


export const handler = async (event) => {
	let note = ''
	try {





		note = `lambda says: ${Sticker().all}, ping5done`

	} catch (e) { note = 'ping5 lambda error: '+e.stack }
	return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({note}) }
}
