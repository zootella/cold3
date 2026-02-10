<script setup> definePageMeta({layout: 'column-layout', note: 'on card'})//./pages/card/[more].vue

import {
otpGenerate,
} from 'icarus'
const _route = useRoute()
const _site = useSiteConfig()

let name1 = _route.params.more//from the route after "card"; property name is more because this file is named [more].vue

let sticker = stickerParts()
let stickerText = [sticker.where, sticker.sealedText, sticker.hashText].join('.')

defineOgImage('ProfileCard', {
	title: `🧔🏻 ${name1}`,
	sticker: stickerText,
})

const refSource = ref('')
const refFound = ref('')
const refDelay = ref(-1)//how many milliseconds it took to generate the new image, or deliver it from the cache
let whenMounted

onMounted(async () => {//only runs in browser, because document doesn't exist on server render
	whenMounted = Now()//start time of the page waiting for the image to arrive

	let s = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || ''
	if (s && isLocal()) {//if we navigate here from a route that didn't set a card, s will be blank
		let u = new URL(s)
		u.protocol = 'http'
		u.host = 'localhost:3000'
		s = u.toString()
	}
	log(look(s))
	if (hasText(s)) {
		refSource.value = s
		refFound.value = s
	} else {
		refSource.value = s
		refFound.value = 'no meta og image content; this tab probably first GETed a route without a card'
	}
})

function onImageLoad() {
	refDelay.value = Now() - whenMounted//end time of the page waiting for the image to arrive, seeing ~1500s for new cards
}

function randomPage() {
	let name2 = name1.replace(/\d+$/, '') + otpGenerate(4)//compose an alternate random name to link to
	navigateTo({name: _route.name, params: {more: name2}})//using navigateTo because what it does is the same as NuxtLink, chat tells me
	//ttd february, yeah, but now on nuxt4 thsi seems to reload the spa while it didn't before
}

function hardReload() { window.location.reload() }//same as user clicking the browser's Reload button

</script>
<template>

<p>Three image tests on this page: (1) signed media URLs, (2) social cards, and (3) QR codes:</p>

<VhsDemo />

<div>
	<p>
		meta og image delivered to page in {{refDelay}}ms;
		<Button link :click="hardReload">Browser reload</Button>; or link to a
		<Button link :click="randomPage">different random page</Button>
	</p>
	<div><pre class="whitespace-pre-wrap break-words">{{refFound}}</pre></div>
	<p><img :src="refSource" @load="onImageLoad" /></p>
</div>

<QrDemo />

</template>
