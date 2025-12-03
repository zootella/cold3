//./src/routes/continue/[provider]/+page.server.js ~ on the oauth trail, sveltekit server render

import {
Now, Limit, log, look,
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
		}
		if (event?.platform?.env) {
			sources.push({note: 'a20', environment: event?.platform?.env})
		}
		await decryptKeys('svelte', sources)

		let letter = await openEnvelope('OauthContinue.', event.url.searchParams.get('envelope'))//oauth envelope [2] open continue

		return {}//GET looks good to start the oauth flow; in sveltekit return nothing or an empty object to deliver the page

	} catch (e) {
		throw redirect(303, `${originApex()}`)//ttd november, this is unusual in that you are navigating to the nuxt error page, rather than having the component that it corresponds to take over the nuxt spa, but this should be ok (claude, let's confirm)
	}
}
