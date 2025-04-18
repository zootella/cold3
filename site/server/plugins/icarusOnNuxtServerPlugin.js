
/*
./icarus/index.js                           - 1 Icarus library functions bundled together for export to both Nuxt and Lambda
./site/composables/icarusOnNuxtClient.js    - 2 Nuxt composable to automatically import them into client-side Nuxt .vue files
./site/server/plugins/icarusOnNuxtServer.js - 3 Nitro plugin to pin them globally so they're also in server-side Nuxt .js files

^ you've wired together these three so common Icarus functions are automatically imported
in Lambda files you still have to import these from Icarus manually, but that's fine because the Lambda side is small
*/
import {

wrapper, Sticker, isLocal, isCloud,
Now, Time, Size, Limit, newline,
defined,
toss, log, look,
noop, test, ok,

toBoolean, toTextOrBlank,
checkInt, minInt,
intToText, textToInt,
hasText, checkText,
hasTextOrBlank, checkTextOrBlank,

Tag, hasTag, checkTag, checkTagOrBlank,
checkHash,

dog, logAudit, logAlert,
awaitDog, awaitLogAudit, awaitLogAlert,

canGetAccess, getAccess,
doorWorker, doorLambda,
Task,

} from 'icarus'
const whatWeImported = {//we could import * to avoid duplicating the list, but that would make things harder on the tree shaker; ESM doesn't have a way to import a dynamic list (which makes sense) nor a way to get a list that was imported

wrapper, Sticker, isLocal, isCloud,
Now, Time, Size, Limit, newline,
defined,
toss, log, look,
noop, test, ok,

toBoolean, toTextOrBlank,
checkInt, minInt,
intToText, textToInt,
hasText, checkText,
hasTextOrBlank, checkTextOrBlank,

Tag, hasTag, checkTag, checkTagOrBlank,
checkHash,

dog, logAudit, logAlert,
awaitDog, awaitLogAudit, awaitLogAlert,

canGetAccess, getAccess,
doorWorker, doorLambda,
Task,

}
export default defineNitroPlugin((nitroApp) => {
	Object.keys(whatWeImported).forEach((name) => {
		if (!globalThis[name] && whatWeImported[name]) globalThis[name] = whatWeImported[name]
	})

	/*
	and, also do these next two
	Nuxt imports useRuntimeConfig and setResponseStatus into files under /server/api
	but if code there calls down into a function in an icarus file outside of that folder, they're not defined
	you were passing them around and saving them in a module variable, which was cumbersome
	instead of that, now we pin them global:
	*/
	if (!globalThis.useRuntimeConfig  && typeof useRuntimeConfig  == 'function') globalThis.useRuntimeConfig  = useRuntimeConfig
	if (!globalThis.setResponseStatus && typeof setResponseStatus == 'function') globalThis.setResponseStatus = setResponseStatus
})
