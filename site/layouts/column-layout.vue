<script setup>//./layouts/column-layout.vue - layout that wraps into centered column and starts with navigation links

const route = useRoute()//get the note from definePageMeta

</script>
<template>

<div class="page-container">
	<NavigationBar :note="route.meta.note" />
	<main><slot /></main>
</div>

</template>
