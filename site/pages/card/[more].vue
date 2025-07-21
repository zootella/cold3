<script setup> definePageMeta({layout: 'column-layout', note: 'on card'})//./pages/card/[more].vue

import {
randomCode,
} from 'icarus'
const _route = useRoute()
const _site = useSiteConfig()

let name1 = _route.params.more//from the route after "card"; property name is more because this file is named [more].vue
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
	whenMounted = Now()//start time of the page waiting for the image to arrive

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
	refDelay.value = Now() - whenMounted//end time of the page waiting for the image to arrive, seeing ~1500s for new cards
}

function randomPage() {
	let name2 = name1.replace(/\d+$/, '') + randomCode(4)//compose an alternate random name to link to
	navigateTo({name: _route.name, params: {more: name2}})//using navigateTo because what it does is the same as NuxtLink, chat tells me
}

function hardReload() { window.location.reload() }//same as user clicking the browser's Reload button

</script>
<template>

<p>
	image delivered to page in {{refDelay}}ms;
	<LinkButton @click="hardReload">Browser reload</LinkButton>; or link to a
	<LinkButton @click="randomPage">different random page</LinkButton>
</p>
<p><code>{{refSource}}</code></p>
<p><img :src="refSource" @load="onImageLoad" /></p>

</template>
