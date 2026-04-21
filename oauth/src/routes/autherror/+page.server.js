//on the oauth trail *and* on the error trail: SvelteKit handler for Auth.js's pages.error redirect target

import {
log, look, Limit,
defined,
decryptKeys,
sealEnvelope,
originApex,
} from 'icarus'
import {redirect} from '@sveltejs/kit'

export async function load(event) {
	let sources = []
	if (defined(typeof process) && process.env) {
		sources.push({note: 'h10', environment: process.env})
	}
	if (event?.platform?.env) {
		sources.push({note: 'h20', environment: event?.platform?.env})
	}
	await decryptKeys('autherror', sources)

	/*
	Auth.js catches unhandled exceptions in our signIn/redirect/session callbacks (see @auth/core/src/lib/actions/callback/index.ts), wraps them as AccessDenied, and redirects here via the pages.error config in auth.js; this handler seals the error type into an Error3. envelope and bounces to nuxt's error3 so the user lands on error.vue with our branding instead of Auth.js's generic gray error page
	*/

	const errorType = event.url.searchParams.get('error') || 'unknown'//Auth.js passes the error type name as a query parameter (e.g. "AccessDenied", "Configuration")

	let envelope = await sealEnvelope('Error3.', Limit.handoffWorker, {error: {name: 'AuthError', message: `Auth.js rejected sign-in: ${errorType}`, authErrorType: errorType}})//we don't get the original exception from Auth.js here (it swallowed that inside its own try/catch), only the error type string — so we construct a POJO with what we have; makeText inside sealEnvelope handles it
	log('Auth.js rejection landing, sealing Error3. envelope', look({errorType}))

	throw redirect(303, `${originApex()}/error3?envelope=${envelope}`)
}
