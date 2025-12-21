<script setup>
//this file is ./components/HitComponent.vue

const flexStore = useFlexStore()
await flexStore.getHits()
/*
ttd april2025
this whole store where it renders on server if on the page for a first GET, and on the client if clicked into later
is academic, isn't something you're going to actually use
but another idea here is:

let p = flexStore.getHits()
if (process.sever) await p

also isn't this what useState() is about?
current behavior here is good, except if you click into a route that has the hit component, the POST interrupts the navigation, which is bad
*/

async function clickedHit() {
	await flexStore.incrementHits()
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>HitComponent</i></p>

<Button :handler="clickedHit">Hit</Button>
{{flexStore.hits}} hits in {{flexStore.duration}}ms from {{flexStore.sticker}}

</div>
</template>
