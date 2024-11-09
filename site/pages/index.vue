<script setup>

import {
log, look, Sticker,
} from 'icarus'

defineOgImageComponent('NuxtSeo', {
	title: `🍺 cold3.cc, v3`,
	description: Sticker().all,
	theme: '#ff0000',
	colorMode: 'light',
	cacheMaxAgeSeconds: 0,//disable caching just for this image
})

</script>
<template>
<div>

<NavigationComponent note="on index" />

<ColdComponent />

</div>
</template>
