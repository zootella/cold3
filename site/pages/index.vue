<script setup> definePageMeta({layout: 'column-layout', note: 'on index'})

let sticker = stickerParts()
let stickerText = [sticker.where, sticker.sealedText, sticker.hashText].join('.')

defineOgImageComponent('NuxtSeo', {
	title: `🏠 static home card`,
	description: stickerText,
	theme: '#ff00ff',
	colorMode: 'light',
})
//ttd july, this defines the card for the home page, but how do you set a generic site card for every page that isn't user generated? so that if someone links cold3.cc/terms, for instance, they don't get a terms card, that would be silly, but they do get the same card as for cold3.cc But also, of course, if it's a route to a user page or post, then the card is specific to that user generated content

</script>
<template>

<HelloComponent />

</template>
