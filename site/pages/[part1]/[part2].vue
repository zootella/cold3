<script setup> definePageMeta({layout: 'column-layout', note: 'on post'})

const route = useRoute()
const renderStore = useRenderStore()
await renderStore.load(route.params.part1)
useRouteCorrection(route.params.part1, route.fullPath)

</script>
<template>

<PostPage :postId="route.params.part2" />

</template>
