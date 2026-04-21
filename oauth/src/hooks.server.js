//on the oauth trail: list of SvelteKit server middleware

import {sequence} from '@sveltejs/kit/hooks'
import {redirect, isRedirect, isHttpError} from '@sveltejs/kit'
import {originApex, sealEnvelope, Limit} from 'icarus'
import {handle as authHandle} from './auth'//register Auth.js's handle-compatible middleware function, which will run and review every request

async function fatalCatcher({event, resolve}) {//wraps auth's handle; any uncaught exception from any SvelteKit route gets sent here
	try {
		return await resolve(event)//dispatches the request into all downstream work — load functions, Auth.js middleware, page rendering — so anything that throws in there propagates up to our catch
	} catch (e) {
		if (isRedirect(e)) throw e//SvelteKit uses throw to signal redirects; pass through unchanged so 30X responses still work
		if (isHttpError(e)) throw e//same for deliberate error() throws, should we ever use them

		//on the error trail: SvelteKit error handlers

		//if we make it here, e is an actual exceptional circumstance, like our code threw or called toss
		let envelope = await sealEnvelope('Error3.', Limit.handoffWorker, {error: e})//seal the error in an envelope for the query string
		throw redirect(303, `${originApex()}/error3?envelope=${envelope}`)//and have this nuxt page log it to datadog and blow up the page
	}
}

export const handle = sequence(fatalCatcher, authHandle)//sequence(a, b) chains handle functions outer-to-inner: a runs first, and its resolve() call invokes b. so sequence(fatalCatcher, authHandle) means Auth.js's middleware runs fully contained inside our try/catch
