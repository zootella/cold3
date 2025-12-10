<script setup>//components/NavigateButton.vue
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

<NuxtLink :to="to"><slot /></NuxtLink>

</template>
<style scoped>

a {
	@apply inline-flex items-center text-white px-2 py-1 rounded cursor-pointer;
	@apply bg-green-600;
}
a:hover {
	@apply bg-green-400;
}
a:focus-visible {
	@apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

</style>
