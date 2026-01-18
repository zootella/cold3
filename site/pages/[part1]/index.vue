<script setup>

const route = useRoute()
const {userTag, userName} = await useUserRoute(route.params.part1, route.fullPath)

</script>
<template>
<div>

<h1>{{ userName }}</h1>
<p>user profile page for {{ userTag }}</p>

</div>
</template>
