<script>//./src/routes/continue/[provider]/+page.svelte ~ workaround to turn a GET here to a POST that begins the oauth flow
/*
in the [oauth.cold3.cc] [SvelteKit] workspace using [@auth/sveltekit],
this is the file ./src/routes/continue/[provider]/+page.svelte
*/

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
