//./src/routes/continue/[provider]/+page.server.js ~ on the oauth trail, sveltekit server render

import {
Now, Limit,
defined, toss, checkInt,
Key, decryptKeys,
encryptSymmetric,
originApex,
} from 'icarus'
import {redirect} from '@sveltejs/kit'

export async function load(event) {
	try {

		let sources = []
		if (defined(typeof process) && process.env) {
			sources.push({note: '5000: process.env', environment: process.env})
		}//seeing 5000 cloud, only (confirm)
		if (event?.platform?.env) {
			sources.push({note: '5010: event.platform.env', environment: event?.platform?.env})
		}//seeing 5010 both, local and cloud (confirm, ttd november)
		await decryptKeys('sveltekit worker', sources)

		let envelope = event.url.searchParams.get('envelope')
		let symmetric = encryptSymmetric(Key('envelope, secret'))
		let letter = await symmetric.decryptObject(envelope)
		checkInt(letter.dated)
		if (letter.dated + Limit.handoff < Now()) toss('expired')

		return {}//GET looks good to start the oauth flow; in sveltekit return nothing or an empty object to deliver the page

	} catch (e) {
		throw redirect(303, `${originApex()}/error`)//ttd november, this is unusual in that you are navigating to the nuxt error page, rather than having the component that it corresponds to take over the nuxt spa, but this should be ok (claude, let's confirm)
	}
}
