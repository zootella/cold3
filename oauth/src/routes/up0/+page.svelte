<script>//./src/routes/up0/+page.svelte ~ simple static page for checkly at https://oauth.cold3.cc/up0

import {

//manual icarus import block for sveltekit
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

} from 'icarus'

if (false) log(Sticker())//runs ssr and also client as part of sveltekit's universal rendering

</script>

<p><code>{Sticker()}, up0done</code></p>
