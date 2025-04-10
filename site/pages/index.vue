<script setup>

definePageMeta({layout: 'feed-layout', note: 'on index'})

import {
log, look,
} from 'icarus'

defineOgImageComponent('NuxtSeo', {
	title: `🍺 cold3.cc`,
	description: Sticker().all,
	theme: '#ff00ff',
	colorMode: 'light',
})

</script>
<template>

<IndexPage />

</template>
