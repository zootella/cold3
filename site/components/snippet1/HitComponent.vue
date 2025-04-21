<script setup>
//this file is ./components/HitComponent.vue

const hitStore = useHitStore()

await hitStore.getHits()//ttd april, technically probably not ok to use await here?!
//ttd april, you asked chat if await is ok on the margin here, and it said no! but when you changed to below, now an empty box renders before filling, which is distracting, and you can't see the sticker from the server when you refresh at page2 anymore! figure out the right way to do this, before you use it for hello0 and everything, maybe through simplicity in the quick monolith, maybe with getAsyncData()
/*
onMounted(async () => {
	await hitStore.getHits()
})

even without getAsyncData, you are preventing the page from double-fetching with this design now
if the empty box flash is a problem, you could also put a v-show or v-if on the root div in the template, too
it's also possible even with no additional flash protection, when you've got everything in hello0 and hello0 is SSRing a complete page from the first GET, the whole page appears all at once for the user, anyway
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
