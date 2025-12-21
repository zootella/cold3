<script setup>//./components/OauthDemo.vue ~ on the oauth trail, nuxt component

import {
originOauth,
} from 'icarus'

const origin = originOauth()//will be "https://oauth.cold3.cc" cloud, or "http://localhost:5173" local

const refDoing = ref(false)

const buttonState = computed(() => {
	return refDoing.value ? 'ghost' : 'ready'//clicked button shows 'doing' via Button's internal state, others show 'ghost'
})

async function clicked(provider) {
	refDoing.value = true//note we don't need to set false because href= is going to tear down the whole Nuxt application
	let response = await fetchWorker('/api/oauth', {method: 'POST', body: {action: 'OauthStart.'}})
	window.location.href = `${originOauth()}/continue/${provider}?envelope=${response.envelope}`//encoding? base62 don't need no stinkin' encoding 👒
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>OauthDemo</i></p>

<div><Button :state="buttonState" :click="() => clicked('google')">Continue with Google</Button></div>
<div><Button :state="buttonState" :click="() => clicked('twitter')">Continue with 𝕏</Button></div>
<div><Button :state="buttonState" :click="() => clicked('discord')">Continue with Discord</Button> test flow here</div>

</div>
</template>
