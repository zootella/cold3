<script>
/*
in the [oauth.cold3.cc] [SvelteKit] repo using [@auth/sveltekit],
this is the file ./src/routes/+page.svelte
*/

import {

//manual icarus import block for sveltekit
wrapper, Sticker, stickerParts, isLocal, isCloud,
Now, Time, Size, Limit, newline,
defined, toss, log, look,
noop, test, ok,

toBoolean, toTextOrBlank, isObject,
checkInt, minInt,
intToText, textToInt, commas,
hasText, checkText,
hasTextOrBlank, checkTextOrBlank,
makePlain, makeObject, makeText,

Tag, hasTag, checkTag, checkTagOrBlank,
checkHash,

dog, logAudit, logAlert,
awaitDog, awaitLogAudit, awaitLogAlert,

Key, accessKey, canGetAccess, getAccess,
doorWorker, doorLambda,
Task, fetchWorker, fetchLambda, fetchProvider,

} from 'icarus'

/*
ttd june2025, make this page do a client side redirect to cold3.cc
all it needs to do is show google the site verification code
users shouldn't go here
*/

/*
ttd june2025, move this down into the head section below
filled in with the google site verification code for oauth.cold3.cc
<meta name="google-site-verification" content="" />
*/
</script>
<svelte:head>

</svelte:head>
<div>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
<p>SvelteKit site on Cloudflare Workers to host <i>oauth.cold3.cc</i></p>
<p>This HTML comes from a file at <code>./src/routes/+page.svelte</code><br />
where <i>Sticker()</i> says <code>{Sticker()}</code></p>

<h2>List</h2>
<p>List configured OAuth providers at <a href="/auth/providers">/auth/providers</a> and then</p>

<h2>Start flow with GET (doesn't work)</h2>
<p><a href="/auth/signin/google">Continue with Google</a></p>
<p><a href="/auth/signin/twitter">Continue with Twitter</a></p>

<h2>Start flow with POST (does work, but we need to start from cold3.cc, not from here!</h2>
<div><form method="POST" action="/auth/signin/google"><button type="submit">Continue with Google</button></form></div>
<div><form method="POST" action="/auth/signin/twitter"><button type="submit">Continue with Twitter</button></form></div>

</div>
