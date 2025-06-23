<script setup>//./app.vue

import {
addTurnstileHeadScript,
} from 'icarus'

let head = {
	title: 'cold3.cc',
	link: [
		{
			rel: 'icon',
			href: `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍺</text></svg>`,
		},
	],
}
addTurnstileHeadScript(head)
useHead(head)

/*
this site uses universal rendering, sometimes called hybrid rendering, and it's great for the user:
(1) before they click:
the preview of a link posted to Reddit or shared in WhatsApp contains user generated details
(including the benefit of server rendering, as offered in 1994 by the original web), *and*
(2) after they click:
the page appears all at once, (rather than growing in several quick jerky steps)
and then clicks from page to page appear instantaneous (seamless SPA transitions using DOM diffing)
(the benefit of client rendering, as offered in 2005 by AJAX and possibly XMLHttpRequest)

https://nuxt.com/docs/guide/concepts/rendering#universal-rendering
"similar to traditional server-side rendering performed by PHP"
"Nuxt runs the JavaScript (Vue.js) code in a server environment and returns a fully rendered HTML page to the browser"
"Users immediately get the entirety of the initial content of the application, contrary to client-side rendering."
"The same JavaScript code that once ran on the server runs on the client (browser) again in the background now enabling interactivity"
"as the content is already present in the HTML document, crawlers can index it"
*/
const mainStore = useMainStore()
await mainStore.load()//run store and component code on the server to render everything in response to a new tab's GET; comes with cookie
onMounted(async () => { await mainStore.mounted() })//run on the page at the start; now you have browser graphics and navigation duration
/*
within universal rendering, some notes about this "all-at-once" page pattern we found:
await on the margin makes this block on server rendering, which is what we want
.load() runs exactly once on the server for each tab's first GET
does run again on the client, but mainStore.loaded true makes that a no-op
does not run after that as the page POSTs to server endpoints; a plugin like mainPlugin.server.js would!

this pattern avoids
- warnings in older Nuxt and Vue documentation against using await on the script setup margin
- putting await in onLoaded(), which would completely break SSR
- using a server only plugin, which would run on every later POST
- myriad APIs that look like the "right way" specific solution, like useFetch, useAsyncData, and Pinia's callOnce
*/

</script>
<template>

<TopBar /><!-- contains notifications for the user, like enter the code we just sent -->
<NuxtLayout>
	<NuxtPage />
</NuxtLayout>
<BottomBar /><!-- will contain the single global invisible turnstile widget after a PostButton needs it -->

</template>
