<script setup>
//this file is ./components/HitComponent.vue

import {
log, look, Now, Tag,
getBrowserTag,
} from 'icarus'
import {ref, reactive, onMounted, watch} from 'vue'
import {useStore1} from '~/stores/store1'

const store1 = useStore1()
await store1.getHits()
/*
pinia pattern notes:
-it's all $fetch now, and in the store--no fetch here; no useFetch anywhere
*/

async function clickedHit() {
	await store1.incrementHits()
}

</script>
<template>
<div>

<button class="pushy" @click="clickedHit()">Hit</button>
{{store1.hits}} hits in {{store1.duration}}ms from {{store1.sticker}}

<p><i>"{{store1._ipAddressOnLoad}}"</i> ip address on load, blank running local</p>
<p><i>"{{store1._userAgentOnLoad}}"</i> user agent on load</p>
<p><i>'{{store1._browserGraphics}}'</i> browser graphics</p>
<p><i>"{{store1._browserTag}}"</i> browser tag</p>

</div>
</template>
