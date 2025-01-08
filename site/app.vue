<script setup>

import {
Sticker,
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
if (Sticker().isCloud) head.script = [{
	//from https://developers.cloudflare.com/turnstile/get-started/#add-the-turnstile-widget-to-your-site
	src: 'https://challenges.cloudflare.com/turnstile/v0/api.js',
	async: true,//tell the browser: you can download this script while you're parsing the HTML,
	defer: true,//but don't run the script until you've finished fully paring the HTML
}]
useHead(head)

</script>
<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>
