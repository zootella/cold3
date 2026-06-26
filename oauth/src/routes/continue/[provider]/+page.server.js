//on the oauth trail: SvelteKit server render

import {
openEnvelope,
} from 'icarus'

export async function load(event) {//note that at this point, the code in auth.js has already called decryptKeys

	let letter = await openEnvelope('OauthEnvelopeContinue.', event.url.searchParams.get('envelope'))//oauth envelope step 2: open continue envelope
	//if we're still here, opening the envelope didn't throw, it's valid
	return {}//GET looks good to start the oauth flow; in SvelteKit return nothing or an empty object to deliver the page
}
