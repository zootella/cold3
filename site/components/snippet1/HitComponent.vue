<script setup>
//this file is ./components/HitComponent.vue

const flexStore = useFlexStore()
await flexStore.getHits()

async function clickedHit() {
	await flexStore.incrementHits()
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>HitComponent</i></p>

<button class="pushy" @click="clickedHit()">Hit</button>
{{flexStore.hits}} hits in {{flexStore.duration}}ms from {{flexStore.sticker}}

</div>
</template>
