
/*
./icarus/index.js                           - 1 Icarus library functions bundled together for export to both Nuxt and Lambda
./site/composables/icarusComposable.js      - 2 Nuxt composable to automatically import them into client-side Nuxt .vue files
./site/server/plugins/icarusServerPlugin.js - 3 Nitro plugin to pin them globally so they're also in server-side Nuxt .js files

^ you've wired together these three so common Icarus functions are automatically imported
in Lambda files you still have to import these from Icarus manually, but that's fine because the Lambda side is small
*/
export {

//manual icarus import block for nuxt client
wrapper, Sticker, stickerParts, isLocal, isCloud,
Now, Time, Size, Limit, newline,
defined, toss, log, look,
noop, test, ok,

toBoolean, toTextOrBlank,
checkInt, minInt,
intToText, textToInt, commas,
hasText, checkText,
hasTextOrBlank, checkTextOrBlank,
makePlain, makeObject, makeText,
safefill, deindent,

Tag, hasTag, checkTag, checkTagOrBlank,
checkHash,

dog, logAudit, logAlert,
awaitDog, awaitLogAudit, awaitLogAlert,

Key, accessKey, canGetAccess, getAccess,
doorWorker, doorLambda,
Task, fetchWorker, fetchLambda, fetchProvider,
sealEnvelope, openEnvelope,
composeCookieName, composeCookieValue, parseCookieValue,

} from 'icarus'
