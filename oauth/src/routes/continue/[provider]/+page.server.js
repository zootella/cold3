//./src/routes/continue/[provider]/+page.server.js ~ on the oauth trail, sveltekit server render

import {
Now, Limit,
defined, toss, checkInt,
Key, decryptKeys,
openEnvelope, isExpired,
originApex,
} from 'icarus'
import {redirect} from '@sveltejs/kit'

export async function load(event) {
	try {

		let sources = []//collect possible sources of environment variables; there are a lot of them 😓
		if (defined(typeof process) && process.env) {
			sources.push({note: 'a10', environment: process.env})
		}//seeing a10 cloud only (you expect, have not observed, ttd november)
		if (event?.platform?.env) {
			sources.push({note: 'a20', environment: event?.platform?.env})
		}//seeing a20 both local and cloud (you expect, have not observed, ttd november)
		await decryptKeys('svelte', sources)

		let letter = await openEnvelope(event.url.searchParams.get('envelope'))
		if (letter.action != 'OauthContinue.') toss('envelope has wrong action')
		if (isExpired(letter.expired)) toss('expired')

		return {}//GET looks good to start the oauth flow; in sveltekit return nothing or an empty object to deliver the page

	} catch (e) {
		throw redirect(303, `${originApex()}/error`)//ttd november, this is unusual in that you are navigating to the nuxt error page, rather than having the component that it corresponds to take over the nuxt spa, but this should be ok (claude, let's confirm)
	}
}
