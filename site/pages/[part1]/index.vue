<script setup> definePageMeta({layout: 'column-layout', note: 'on profile'})

const route = useRoute()
const renderStore = useRenderStore()
await renderStore.load(route.params.part1)
useRouteCorrection(route.params.part1, route.fullPath)

</script>
<template>

<ProfilePage />

</template>
