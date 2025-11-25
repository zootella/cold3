<script setup>//./components/OauthDemo.vue

import {
originOauth,
} from 'icarus'

const origin = originOauth()//will be "https://oauth.cold3.cc" cloud, or "http://localhost:5173" local

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>OauthDemo</i></p>

<p><a :href="origin+'/continue/google'">Continue with Google</a></p>
<p><a :href="origin+'/continue/twitter'">Continue with Twitter</a></p>
<p><a :href="origin+'/continue/discord'">Continue with Discord</a>, to begin, this is the only one that works</p>

</div>
</template>
