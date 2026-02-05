<script setup>
/*
use like:
<NavigateButton to="/about">About Page</NavigateButton>

looks like a button; causes a navigation that changes the route and is reversed by the browser's Back button
use NavigateButton when, if you were coding regular HTML, you'd be reaching for <a href="">
under the hood, this is just NuxtLink styled to look like a button
*/

const props = defineProps({
	to: {type: [String, Object], required: true}
})

</script>
<template>

<NuxtLink :to="to" class="my-button ready"><slot /></NuxtLink>

</template>
