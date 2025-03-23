<script setup>//components/Navigate.vue
/*
use like:
<Navigate :to="/about">About Page</Navigate>

looks like a link; causes a navigation that changes the route and is reversed by the browser's Back button
use Navigate when, if you were coding regular HTML, you'd be reaching for <a href="">
under the hood, this is just NuxtLink given an easier name
*/

const props = defineProps({
	to: {type: [String, Object], required: true}
})

</script>
<template>

<NuxtLink :to="to"><slot /></NuxtLink>

</template>
