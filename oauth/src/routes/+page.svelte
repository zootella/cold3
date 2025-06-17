<script>
/*
in the [oauth.cold3.cc] [SvelteKit] repo using [@auth/sveltekit],
this is the file ./src/routes/+page.svelte
*/

/*
ttd june, move this down into the head section below
filled in with the google site verification code for oauth.cold3.cc
<meta name="google-site-verification" content="" />
*/

/*
ttd june, make this page do a client side redirect to cold3.cc
all it needs to do is show google the site verification code
users shouldn't go here
*/

</script>
<svelte:head>

</svelte:head>
<div>

<h1>Welcome to SvelteKit</h1>
<p>This HTML comes from a file at <code>./src/routes/+page.svelte</code></p>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
<p>SvelteKit site on Cloudflare Workers to host <i>oauth.cold3.cc</i>, deployment number: v3</p>

<h2>List</h2>
<p>List configured OAuth providers at <a href="/auth/providers">/auth/providers</a> and then</p>

<h2>Start flow with GET (doesn't work)</h2>
<p><a href="/auth/signin/google">Continue with Google</a></p>
<p><a href="/auth/signin/twitter">Continue with Twitter</a></p>

<h2>Start flow with POST (does work, but we need to start from cold3.cc, not from here!</h2>
<div><form method="POST" action="/auth/signin/google"><button type="submit">Continue with Google</button></form></div>
<div><form method="POST" action="/auth/signin/twitter"><button type="submit">Continue with Twitter</button></form></div>

</div>
