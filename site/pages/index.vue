<script setup>

import {
log, look, Sticker,
} from 'icarus'

defineOgImageComponent('NuxtSeo', {
	title: `🍺 cold3.cc`,
	description: Sticker().all,
	theme: '#ff00ff',
	colorMode: 'light',
})

</script>
<template>
<div class="page-container">

<NavigationComponent note="on index" />

<ColdComponent />

</div>
</template>
