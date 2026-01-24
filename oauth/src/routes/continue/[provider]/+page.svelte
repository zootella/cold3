<script>//on the oauth trail, sveltekit client page

import {onMount} from 'svelte'
import {page} from '$app/stores'//get svelte's page store, which holds the url and parameters

onMount(() => {//run once the browser has rendered this page, and never on the server

	history.replaceState(null, '', location.href)//prevent this page from being a stop in the browser's Back history

	const form = document.createElement('form')
	form.method = 'POST'
	form.action = `/auth/signin/${$page.params.provider}`

	form.style.display = 'none'//hide the empty form node to avoid flashing the DOM
	document.body.append(form)
	form.submit()
})

</script>
