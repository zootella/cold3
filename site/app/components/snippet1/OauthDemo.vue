<script setup>//on the oauth trail: Nuxt component

import {
originOauth,
} from 'icarus'

const origin = originOauth()//will be "https://oauth.cold3.cc" cloud, or "http://localhost:5173" local

const refClickedProvider = ref(null)

function functionState(provider) {
	if (!refClickedProvider.value) return 'ready'
	return refClickedProvider.value == provider ? 'doing' : 'ghost'
}//interestingly, this works with this function in the template, rather than needing to use a computed property, ttd december2025

async function clicked(provider) {
	refClickedProvider.value = provider//note we don't need to set null because href= is going to tear down the whole Nuxt application
	let task = await fetchWorker('/oauth', 'OauthStart.')
	window.location.href = `${originOauth()}/continue/${provider}?envelope=${task.envelope}`//encoding? base62 don't need no stinkin' encoding 👒
}

onMounted(() => { window.addEventListener('pageshow', onShow) })//listen for pageshow to be able to tell if the user clicks Back here
onUnmounted(() => { window.removeEventListener('pageshow', onShow) })
function onShow(event) {
	if (event.persisted) {//true if the browser just thawed the page state from bfcache, meaning the user clicked Back from one of the oauth permission pages like Google or Discord
		refClickedProvider.value = null//reset our memory of which one they clicked so they can choose again
		refKey.value = Tag()//neat Vue trick to get a single dom element to render anew
	}
}
const refKey = ref(Tag())//change to force Vue to recreate

</script>
<template>
<div class="border border-gray-300 p-2" :key="refKey"><!-- changing key makes Vue destroy and recreate this div and all child components, resetting their internal state -->
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>OauthDemo</i></p>

<div><Button :state="functionState('google')"  :click="() => clicked('google') ">Continue with Google ➜</Button></div>
<div><Button :state="functionState('twitter')" :click="() => clicked('twitter')">Continue with 𝕏 ➜</Button></div>
<div><Button :state="functionState('discord')" :click="() => clicked('discord')">Continue with Discord ➜</Button> test flow here</div>

</div>
</template>
