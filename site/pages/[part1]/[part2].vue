<script setup> definePageMeta({layout: 'column-layout', note: 'on pages'})

const route = useRoute()
const part1 = route.params.part1
const part2 = route.params.part2

//ttd february, nested dynamic segments for user and post pages

</script>
<template>
<div>

<h1>Nested Dynamic Page</h1>
<p>Part 1: <strong>{{ part1 }}</strong></p>
<p>Part 2: <strong>{{ part2 }}</strong></p>

</div>
</template>
