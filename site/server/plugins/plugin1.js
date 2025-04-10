//./server/plugins/plugin1.js

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

	//Nuxt imports these in server api endpoint handler files; pin them to global so icarus files can also reach them; getAccess needs this
	if (!globalThis.useRuntimeConfig  && typeof useRuntimeConfig  == 'function') globalThis.useRuntimeConfig  = useRuntimeConfig
	if (!globalThis.setResponseStatus && typeof setResponseStatus == 'function') globalThis.setResponseStatus = setResponseStatus
})
