<script setup> definePageMeta({layout: 'column-layout', note: 'on index'})//./pages/index.vue

let sticker = stickerParts()
let stickerText = [sticker.where, sticker.sealedText, sticker.hashText].join('.')

defineOgImageComponent('NuxtSeo', {
	title: `🏠 static home card`,
	description: stickerText,
	theme: '#ff00ff',
	colorMode: 'light',
})

</script>
<template>

<HelloComponent />

</template>
