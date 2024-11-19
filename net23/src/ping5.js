import { Sticker } from 'icarus'

export default async function handler(lambdaEvent, lambdaContext) {
	let note = ''
	try {
		note = `lambda says: ${Sticker().all}, ping5done`

	} catch (e) { note = 'ping5 lambda error: '+e.stack }
	return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({note}) }
}
