<script setup>

import {
log, look, Sticker,
} from 'icarus'

defineOgImageComponent('NuxtSeo', {
	title: `🍺 cold3.cc`,
	description: Sticker().all,
	theme: '#ff0000',
	colorMode: 'light',
})

</script>
<template>
<div>

<NavigationComponent note="on index" />

<ColdComponent />

</div>
</template>
