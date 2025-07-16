<script setup>//./layouts/cold-layout.vue - layout for pages with navigation bar that names the page

const route = useRoute()//we'll get the note from definePageMeta

</script>
<template>

<NavigationBar :note="route.meta.note" />
<main><slot /></main>

</template>
