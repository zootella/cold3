<script setup>//on the oauth trail: Nuxt component

import {
originOauth,
} from 'icarus'

const origin = originOauth()//will be "https://oauth.cold3.cc" cloud, or "http://localhost:5173" local

const refClickedProvider = ref(null)

function functionState(provider) {
	if (!refClickedProvider.value) return 'ready'
	return refClickedProvider.value == provider ? 'doing' : 'ghost'
}//interestingly, this works with this function in the template, rather than needing to use a computed property, ttd december

async function clicked(provider) {
	refClickedProvider.value = provider//note we don't need to set null because href= is going to tear down the whole Nuxt application
	let response = await fetchWorker('/api/oauth', {method: 'POST', body: {action: 'OauthStart.'}})
	window.location.href = `${originOauth()}/continue/${provider}?envelope=${response.envelope}`//encoding? base62 don't need no stinkin' encoding 👒
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>OauthDemo</i></p>

<div><Button :state="functionState('google')"  :click="() => clicked('google') ">Continue with Google</Button></div>
<div><Button :state="functionState('twitter')" :click="() => clicked('twitter')">Continue with 𝕏</Button></div>
<div><Button :state="functionState('discord')" :click="() => clicked('discord')">Continue with Discord</Button> test flow here</div>

</div>
</template>
