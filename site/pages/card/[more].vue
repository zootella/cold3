<script setup>

import {
log, look, defined, Sticker,
} from 'icarus'

import { useRoute } from 'vue-router'

const route = useRoute()
let more = route.params.more

defineOgImageComponent('NuxtSeo', {
	title: `this is a card for "${more}"`,
	description: Sticker().all,
	theme: '#ff00ff',
	colorMode: 'light'
})

</script>
<template>

<NavigationComponent note="on card" />

<p>this is a page for "{{ more }}"</p>

</template>
