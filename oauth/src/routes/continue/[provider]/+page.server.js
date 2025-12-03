//./src/routes/continue/[provider]/+page.server.js ~ on the oauth trail, sveltekit server render

import {
Now, Limit, log, look,
defined, toss, checkInt,
Key, decryptKeys,
openEnvelope, isExpired,
originApex,
} from 'icarus'
import {redirect} from '@sveltejs/kit'

export async function load(event) {//note that at this point, the code in auth.js has already called decryptKeys
	try {

		let letter = await openEnvelope('OauthContinue.', event.url.searchParams.get('envelope'))//oauth envelope [2] open continue

		return {}//GET looks good to start the oauth flow; in sveltekit return nothing or an empty object to deliver the page

	} catch (e) {
		throw redirect(303, `${originApex()}`)//ttd november, this is unusual in that you are navigating to the nuxt error page, rather than having the component that it corresponds to take over the nuxt spa, but this should be ok (claude, let's confirm)
	}
}
