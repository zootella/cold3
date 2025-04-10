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

</script>
<template>

<TopBar /><!-- contains notifications for the user, like enter the code we just sent -->
<NuxtLayout>
	<NuxtPage />
</NuxtLayout>
<BottomBar /><!-- will contain the single global invisible turnstile widget after a PostButton needs it -->

</template>
