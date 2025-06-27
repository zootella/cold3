<script setup>

import {useRoute} from 'vue-router'//ttd april, is this import already automatic though?

const route = useRoute()
let more = route.params.more

defineOgImageComponent('NuxtSeo', {
	title: `this is a card for "${more}"`,
	description: Sticker(),
	theme: '#ff00ff',
	colorMode: 'light'
})

</script>
<template>

<NavigationBar note="on card" />

<p>this is a page for "{{ more }}"</p>

</template>
