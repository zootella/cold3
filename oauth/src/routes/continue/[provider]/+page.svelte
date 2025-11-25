<script>//./src/routes/continue/[provider]/+page.svelte ~ authenticates a GET from the nuxt site to POST into the auth.js oauth flow

import {
wrapper, Sticker, stickerParts, isLocal, isCloud,
Now, Time, Size, Limit, newline,
defined, toss, log, look,
hasText, checkText,
Tag, hasTag, checkTag, checkTagOrBlank,
Key, decryptKeys, accessKey, canGetAccess, getAccess,
} from 'icarus'

/*
this page shows no content at all; our goal is it's invisible to the user

ok, but find out from chat
how can we write some trusted code here that always runs on the server
and has access to the query string
because it needs to authenticate the envelope before allowing the post
auth will only accept a post from this domain
and this page will only create a post if there's a valid link from the apex, essentially

meaning, we've recorded the start of an oauth flow for that browser tag
*/

import {onMount} from 'svelte'
import {page} from '$app/stores'//get svelte's page store, which holds the url and parameters
import {get} from 'svelte/store'//svelte stores are reactive, so we need this api to read a value imperatively

onMount(() => {//run once the browser has rendered this page, and never on the server

	history.replaceState(null, '', location.href)//prevent this page from being a stop in the browser's Back history

	const provider = get(page).params.provider

	const form = document.createElement('form')
	form.method = 'POST'
	form.action = `/auth/signin/${provider}`

	form.style.display = 'none'//hide the empty form node to avoid flashing the DOM
	document.body.append(form)
	form.submit()
})

</script>
