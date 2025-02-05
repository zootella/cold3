<script setup>
//this file is ./components/HitComponent.vue

import {
log, look, Now, Tag,
getBrowserTag,
} from 'icarus'
import {ref, reactive, onMounted, watch} from 'vue'
import {useHitStore} from '~/stores/hitStore'

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
<div>

<button class="pushy" @click="clickedHit()">Hit</button>
{{hitStore.hits}} hits in {{hitStore.duration}}ms from {{hitStore.sticker}}

</div>
</template>
