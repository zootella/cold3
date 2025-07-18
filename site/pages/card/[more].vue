<script setup> definePageMeta({layout: 'column-layout', note: 'on card'})//./pages/card/[more].vue

import {
randomCode,
} from 'icarus'
const _route = useRoute()
const _site = useSiteConfig()

/*
notes about the nuxt-og-image module on cloudflare workers

https://nuxt.com/modules/og-image
https://nuxtseo.com/docs/og-image/getting-started/introduction

https://github.com/nuxt-modules/og-image
https://www.npmjs.com/package/nuxt-og-image - 41k weekly downloads, low

$ yarn run nuxi module add og-image

+++ b/nuxt.config.ts
-  modules: ["nitro-cloudflare-dev"]
+  modules: ["nitro-cloudflare-dev", "nuxt-og-image"]

+++ b/package.json
 	"dependencies": {
+		"nuxt-og-image": "5.1.6",
+		"@unhead/vue": "^2.0.5",
+		"unstorage": "^1.15.0",
 	},

used the nuxi module install instead of installing manually
edits nuxt config to add the module
pins the module version, only place we've got no carrot!
and also brings in those two peer dependencies, unhead and unstorage

testing this out local and deployed, here's are your observations

you're seeing three speeds:
3244ms new image the worker had to generate
552ms that same route in a new browser; here you think it's coming from the cloudflare KV cache
2ms a browser refresh quickly gets the image from the browser cache

there seems to be a local cache, as locally you occasionally see a really old hashed card

the card is new and correct only for the first hit, not later if you navigate around the site
this is ok, you suppose, as these cards appear for non-browser clients, which only do a first hit
essentially, you're observing that it works like this:
when the tab loads, the meta tags that lead to the card are set
so if you start on the home page, you get the home card, even if you then navigate to the card page
if you do a browser reload, that's the tab loading, so you get a new card
you're seeing this behavior running both locally and deployed, also
*/

let name1 = _route.params.more//from the route after "card"; property name is more because this file is named [more].vue
let name2 = name1.replace(/\d+$/, '') + randomCode(4)//compose an alternate one to link to
/*
if this link is like either of these:
http://localhost:3000/card/example1
https://cold3.cc/card/example1
then name1 will be "example1"

in _route.params.more, the property is called "more" because this file is name [more].vue
we also compose a neighboring name, name2, to link there, replacing any random numbers at the end
*/

let sticker = stickerParts()
let stickerText = [sticker.where, sticker.sealedText, sticker.hashText].join('.')

defineOgImageComponent('NuxtSeo', {
	title: `💦 dynamic card for ${name1}`,
	description: stickerText,
	theme: '#ff00ff',
	colorMode: 'light'
})


const refSource = ref('')
const refDelay = ref(-1)//how many milliseconds it took to generate the new image, or deliver it from the cache
let whenMounted

onMounted(async () => {//only runs in browser, because document doesn't exist on server render
	whenMounted = Now()

	let s = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || ''
	if (isLocal()) {
		let u = new URL(s)
		u.protocol = 'http'
		u.host = 'localhost:3000'
		s = u.toString()
	}
	refSource.value = s
})

function onImageLoad() {
	refDelay.value = Now() - whenMounted
}

function hardReload() { window.location.reload() }//same as user clicking the browser's Reload button

</script>
<template>

<p>
	image delivered to page in {{refDelay}}ms;
	<LinkButton @click="hardReload">Browser reload</LinkButton>; or link to a
	<NuxtLink :to="name2">different random page</NuxtLink>
</p>
<p><code>{{refSource}}</code></p>
<p><img :src="refSource" @load="onImageLoad" /></p>

</template>
