<script setup> definePageMeta({layout: 'column-layout', note: 'on index'})//./pages/index.vue

let sticker = stickerParts()
let stickerText = [sticker.where, sticker.sealedText, sticker.hashText].join('.')

defineOgImage('HomeCard', {
	sticker: stickerText,
})

</script>
<template>

<HelloComponent />

</template>
