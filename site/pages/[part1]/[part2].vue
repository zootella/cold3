<script setup> definePageMeta({layout: 'column-layout', note: 'on pages'})

const route = useRoute()
const {userTag, userName} = await useUserRoute(route.params.part1, route.fullPath)
const part2 = route.params.part2

</script>
<template>
<div>

<h1>{{ userName }}</h1>
<p>Post: <strong>{{ part2 }}</strong></p>

</div>
</template>
