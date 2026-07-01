
/*
./icarus/index.js                           - 1 Icarus library functions bundled together for export to both Nuxt and Lambda
./site/composables/icarusComposable.js      - 2 Nuxt composable to automatically import them into client-side Nuxt .vue files
./site/server/plugins/icarusServerPlugin.js - 3 Nitro plugin to pin them globally so they're also in server-side Nuxt .js files

^ you've wired together these three so common Icarus functions are automatically imported
in Lambda files you still have to import these from Icarus manually, but that's fine because the Lambda side is small
*/
import {

//manual icarus import block for nuxt server import
wrapper, Sticker, stickerParts, isLocal, isCloud,
Now, Time, inSeconds, Size, Limit,
defined, toss, log, look,
noop, test, ok,

toBoolean, toTextOrBlank,
checkInt, minInt,
intToText, textToInt, commas,
checkText, hasText, checkTextSame, hasTextSame,
hasTextOrBlank, checkTextOrBlank,
makePlain, makeObject, makeText,
safefill, deindent,

Tag, hasTag, checkTag, checkTagOrBlank,
checkHash,

dog, logAudit, logAlert,
awaitDog, awaitLogAudit, awaitLogAlert,

Key, decryptKeys, doorWorker, doorLambda,
fetchWorker, fetchLambda, fetchProvider,
sealEnvelope, openEnvelope,
composeCookieName, composeCookieValue, parseCookieValue, cookieOptions,

} from 'icarus'
const whatWeImported = {//we could import * to avoid duplicating the list, but that would make things harder on the tree shaker; ESM doesn't have a way to import a dynamic list (which makes sense) nor a way to get a list that was imported

//manual icarus import block for nuxt server globalize
wrapper, Sticker, stickerParts, isLocal, isCloud,
Now, Time, inSeconds, Size, Limit,
defined, toss, log, look,
noop, test, ok,

toBoolean, toTextOrBlank,
checkInt, minInt,
intToText, textToInt, commas,
checkText, hasText, checkTextSame, hasTextSame,
hasTextOrBlank, checkTextOrBlank,
makePlain, makeObject, makeText,
safefill, deindent,

Tag, hasTag, checkTag, checkTagOrBlank,
checkHash,

dog, logAudit, logAlert,
awaitDog, awaitLogAudit, awaitLogAlert,

Key, decryptKeys, doorWorker, doorLambda,
fetchWorker, fetchLambda, fetchProvider,
sealEnvelope, openEnvelope,
composeCookieName, composeCookieValue, parseCookieValue, cookieOptions,

}
export default defineNitroPlugin((nitroApp) => {
	Object.keys(whatWeImported).forEach((name) => {
		if (!globalThis[name] && whatWeImported[name]) globalThis[name] = whatWeImported[name]
	})

	/*
	and, also do these below
	Nuxt imports useRuntimeConfig and setResponseStatus into files under /server/api
	but if code there calls down into a function in an icarus file outside of that folder, they're not defined
	you were passing them around and saving them in a module variable, which was cumbersome
	instead of that, we pin them global:
	*/
	if (!globalThis.useNuxtApp        && typeof useNuxtApp        == 'function') globalThis.useNuxtApp        = useNuxtApp
	if (!globalThis.useRuntimeConfig  && typeof useRuntimeConfig  == 'function') globalThis.useRuntimeConfig  = useRuntimeConfig
	if (!globalThis.setResponseStatus && typeof setResponseStatus == 'function') globalThis.setResponseStatus = setResponseStatus
	//the other one of these is $fetch, of course, but somehow it's already defined in icarus files, so we're not messing with it

	/*
	decrypt our key block at the start of every request, and lift the og-image signing secret from Key() into runtimeConfig.
	og-image signs card urls during page render and verifies them at /_og/, reading runtimeConfig.ogImage.secret (its utils.js),
	and neither path runs doorWorker's decrypt, so this hook is where Key() reaches it. that keeps the secret in our one encrypted
	.env.keys store instead of a scattered env var (see og.md "URL signing"). it has to be per-request, not at plugin init, because
	the cloudflare env (the r20 source below) only exists on the request event; decryptKeys self-guards, so it's real work once per isolate.
	*/
	let ogSecretInjected = false//inject once per isolate — the decrypted key block doesn't change mid-isolate
	nitroApp.hooks.hook('request', async (event) => {
		let sources = []
		if (defined(typeof process) && process.env)  sources.push({note: 'r10', environment: process.env})
		if (event?.context?.cloudflare?.env)         sources.push({note: 'r20', environment: event.context.cloudflare.env})
		await decryptKeys('request', sources)
		if (!ogSecretInjected) {
			ogSecretInjected = true
			try {
				let c = useRuntimeConfig()//global config — og-image's signing path reads it with no event, so set it globally (not per-request)
				if (!c.ogImage) c.ogImage = {}//c.ogImage is og-image's override slot (its own config lives under c['nuxt-og-image']); setting .secret here wins over the env fallback
				c.ogImage.secret = Key('og, secret')
			} catch (e) { log('og-image: no signing secret in key store yet; og-image uses its own until Key(og, secret) is set', look({e})) }//an optional card secret must never break the global request path, so this one lookup is guarded
		}
	})
})
