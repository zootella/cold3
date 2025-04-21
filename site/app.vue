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

const helloStore = useHelloStore()
await helloStore.load()
//^ttd april, get rid of this after you move stuff into main and other stores

const mainStore = useMainStore()
await mainStore.load()
/*
notes about the "all-at-once" page pattern we found
await on the margin makes this block on server hydration, which is what we want
.load() runs exactly once on the server for each tab's first GET
does run again on the client, but mainStore.loaded true makes that a no-op
does not run after that as the page POSTs to server endpoints; a plugin like mainPlugin.server.js would!

this pattern avoids
- warnings in older Nuxt and Vue documentation against using await on the script setup margin
- putting await in onLoaded(), which would completely break SSR
- using a server only plugin, which would run on every later POST
- myriad APIs that look like the "right way" specific solution, like useFetch, useAsyncData, and Pinia's callOnce
*/

/*
<TopBar /><!-- contains notifications for the user, like enter the code we just sent -->
*/
</script>
<template>

<NuxtLayout>
	<NuxtPage />
</NuxtLayout>
<BottomBar /><!-- will contain the single global invisible turnstile widget after a PostButton needs it -->

</template>
