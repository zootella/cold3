<script setup>//components/NavigateButton.vue
/*
use like:
<NavigateButton :to="/about">About Page</NavigateButton>

looks like a button; causes a navigation that changes the route and is reversed by the browser's Back button
use Navigate when, if you were coding regular HTML, you'd be reaching for <a href="">
under the hood, this is just NuxtLink given an easier name, and styled to look like a button
*/

const props = defineProps({
	to: {type: [String, Object], required: true}
})

</script>
<template>

<NuxtLink :to="to" class="pushy-link"><slot /></NuxtLink>

</template>
