<script setup> definePageMeta({layout: 'column-layout', note: 'on card'})

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
const refFetchDelay = ref(-1)
const refCardSource = ref('')
const refAge = ref('')
let whenMounted
let imageUrl = ''//stable URL for fetch; refSource may become a blob URL after fetch updates the displayed image

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
		imageUrl = s
		refSource.value = s
		refFound.value = s
	} else {
		refSource.value = s
		refFound.value = 'no meta og image content; this tab probably first GETed a route without a card'
	}
})

function onImageLoad() {
	if (refDelay.value >= 0) return//already handled the initial load; subsequent @load events are from blob URL updates
	refDelay.value = Now() - whenMounted
	if (isCloud()) runFetch()
}

async function runFetch() {
	if (!imageUrl) return
	let start = Now()
	let response = await fetch(imageUrl, {cache: 'no-store'})
	refFetchDelay.value = Now() - start

	let source = response.headers.get('x-card-source')
	if      (source === 'FRESH')    refCardSource.value = '🎨 FRESH'
	else if (source === 'RECYCLED') refCardSource.value = '♻️ RECYCLED'
	else if (source)                refCardSource.value = source
	else                            refCardSource.value = ''

	refAge.value = response.headers.get('age') || ''
	refSource.value = URL.createObjectURL(await response.blob())
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
	<p v-if="refDelay >= 0">
		{{isLocal() ? 'local' : 'cloud'}},
		{{refDelay}}ms load,
		<span v-if="refFetchDelay >= 0">
			fetched {{refFetchDelay}}ms,
			<span v-if="refCardSource">{{' '}}{{refCardSource}},</span>
			<span v-if="refAge">{{' '}}{{refAge}}s age,</span>
		</span>
		{{' '}}<Button link :click="randomPage">Random</Button>
		{{' '}}<Button link :click="hardReload">Reload</Button>
		{{' '}}<Button link :click="runFetch">Fetch</Button>
	</p>
	<div><pre class="whitespace-pre-wrap break-words text-xs">{{refFound}}</pre></div>
	<p><img :src="refSource" @load="onImageLoad" /></p>
</div>
<QrDemo />

</template>
