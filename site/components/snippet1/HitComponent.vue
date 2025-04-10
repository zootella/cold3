<script setup>
//this file is ./components/HitComponent.vue

import {
getBrowserTag,
} from 'icarus'
import {ref, reactive, onMounted, watch} from 'vue'
const hitStore = useHitStore()

await hitStore.getHits()
/*
pinia pattern notes:
-it's all $fetch now, and in the store--no fetch here; no useFetch anywhere
*/

async function clickedHit() {
	await hitStore.incrementHits()
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>HitComponent</i></p>

<button class="pushy" @click="clickedHit()">Hit</button>
{{hitStore.hits}} hits in {{hitStore.duration}}ms from {{hitStore.sticker}}

</div>
</template>
