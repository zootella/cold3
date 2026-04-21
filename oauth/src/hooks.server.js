//on the oauth trail: list of SvelteKit server middleware

import {sequence} from '@sveltejs/kit/hooks'
import {redirect, isRedirect, isHttpError} from '@sveltejs/kit'
import {originApex, sealEnvelope, Limit} from 'icarus'
import {handle as authHandle} from './auth'//register Auth.js's handle-compatible middleware function, which will run and review every request

//on the error trail: SvelteKit error handlers

export async function handleError({error, event}) {//SvelteKit calls this when it catches an unexpected error during load/render/serialize — those are caught inside resolve(event), so they never reach fatalCatcher's catch on their own. this hook is telemetry-only (we can't redirect from here), so we stash the error on event.locals for fatalCatcher to pick up after resolve returns. same high-level pattern as the nuxt side's errorPlugin -> pageStore -> error2 handoff: save now, act a moment later
	event.locals.fatalError = error
}

async function fatalCatcher({event, resolve}) {//outer middleware around auth's handle; catches errors two ways: (a) stashed by handleError above after SvelteKit caught them internally, (b) thrown in middleware itself (our code, Auth.js's handle) which SvelteKit doesn't wrap
	try {
		const response = await resolve(event)
		if (!event.locals.fatalError) return response//happy path: no errors anywhere, return SvelteKit's response unchanged
		throw event.locals.fatalError//path (a): re-throw the stashed error so the catch below handles it uniformly with path (b)
	} catch (e) {
		if (isRedirect(e)) throw e//SvelteKit uses throw to signal redirects; pass through unchanged so 30X responses still work
		if (isHttpError(e)) throw e//same for deliberate error() throws, should we ever use them

		//real uncaught exception: seal the error in an envelope and redirect to nuxt error3 which logs to Datadog and renders error.vue
		let envelope = await sealEnvelope('Error3.', Limit.handoffWorker, {error: e})
		throw redirect(303, `${originApex()}/error3?envelope=${envelope}`)
	}
}

export const handle = sequence(fatalCatcher, authHandle)//sequence(a, b) chains handle functions outer-to-inner: a runs first, and its resolve() call invokes b. so sequence(fatalCatcher, authHandle) means Auth.js's middleware runs fully contained inside our try/catch
