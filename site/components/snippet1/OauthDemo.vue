<script setup>//./components/OauthDemo.vue ~ on the oauth trail, nuxt component

import {
originOauth,
} from 'icarus'

const origin = originOauth()//will be "https://oauth.cold3.cc" cloud, or "http://localhost:5173" local

async function clicked(provider) {

	if      (provider == 'google')  { refGoogle.value = 'doing'; refTwitter.value = 'ghost'; refDiscord.value = 'ghost' }
	else if (provider == 'twitter') { refGoogle.value = 'ghost'; refTwitter.value = 'doing'; refDiscord.value = 'ghost' }
	else if (provider == 'discord') { refGoogle.value = 'ghost'; refTwitter.value = 'ghost'; refDiscord.value = 'doing' }
	//ttd november, ok so that's awful, but leaving alone for now because this test is about the oauth flow, not component factoring in forms

	let response = await fetchWorker('/api/oauth', {method: 'POST', body: {action: 'OauthStart.'}})
	window.location.href = `${originOauth()}/continue/${provider}?envelope=${response.envelope}`//encoding? base62 don't need no stinkin' encoding 👒
}

const refGoogle  = ref('ready')
const refTwitter = ref('ready')
const refDiscord = ref('ready')

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>OauthDemo</i></p>

<div><Button v-model="refGoogle"  @click="clicked('google')">Continue with Google</Button></div>
<div><Button v-model="refTwitter" @click="clicked('twitter')">Continue with 𝕏</Button></div>
<div><Button v-model="refDiscord" @click="clicked('discord')">Continue with Discord</Button> test flow here</div>

</div>
</template>
