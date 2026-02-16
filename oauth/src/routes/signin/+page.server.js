//on the oauth trail: Auth sign in page, which we only use when user cancels at the provider

import {
log, look, Limit,
defined,
Key, decryptKeys,
sealEnvelope, hashText,
composeCookieName, parseCookieValue,
originApex,
} from 'icarus'
import {redirect} from '@sveltejs/kit'

export async function load(event) {
	let sources = []
	if (defined(typeof process) && process.env) {
		sources.push({note: 'b10', environment: process.env})
	}
	if (event?.platform?.env) {
		sources.push({note: 'b20', environment: event?.platform?.env})
	}
	await decryptKeys('signin', sources)

	let errorCode = event.url.searchParams.get('error') || 'unknown'

	let browserTag = parseCookieValue(event.cookies.get(composeCookieName()))
	let browserHash = browserTag ? await hashText(browserTag) : null

	let envelope = await sealEnvelope('OauthDone.', Limit.handoffWorker, {error: errorCode, browserHash})
	log('oauth sad path, sealing error envelope', look({errorCode}))

	throw redirect(303, `${originApex()}/oauth2?envelope=${envelope}`)
}
