<script setup>//layout that wraps into centered column and starts with navigation links

const route = useRoute()//get the note from definePageMeta

</script>
<template>

<div class="my-column">
	<NavigationBar :note="route.meta.note" />
	<main><slot /></main>
</div>

</template>
