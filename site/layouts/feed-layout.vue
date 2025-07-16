<script setup>//./layouts/feed-layout.vue - layout for most pages

const route = useRoute()//we'll get the note from definePageMeta

</script>
<template>

<div class="page-container">
	<NavigationBar :note="route.meta.note" />
	<main>
		<slot />
	</main>
</div>

</template>
