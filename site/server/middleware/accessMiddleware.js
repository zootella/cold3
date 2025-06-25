//./server/middleware/accessMiddleware.js

/*
import {

//manual icarus import block for nuxt middleware
wrapper, Sticker, isLocal, isCloud,
Now, Time, Size, Limit, newline,
defined, toss, log, look,
noop, test, ok,

toBoolean, toTextOrBlank,
checkInt, minInt,
intToText, textToInt,
hasText, checkText,
hasTextOrBlank, checkTextOrBlank,
makePlain, makeObject, makeText,

Tag, hasTag, checkTag, checkTagOrBlank,
checkHash,

dog, logAudit, logAlert,
awaitDog, awaitLogAudit, awaitLogAlert,

accessKey, canGetAccess, getAccess,
doorWorker, doorLambda,
Task, fetchWorker, fetchLambda, fetchProvider,

} from 'icarus'
*/

export default defineEventHandler((workerEvent) => {//middleware lets us see the event object before Nuxt calls the specific handler
//	accessKey(workerEvent?.context?.cloudflare?.env)//save the secret from the dashboard in a module variable for getAccess() to use
})
