<script setup>

definePageMeta({layout: 'feed-layout', note: 'on ping3'})

let t = Date.now()
let {data, error} = await useFetch('/api/ping/ping3', {method: 'POST'})
let duration = Date.now() - t

</script>
<template>
<div>
<code>
<a href="ping2">&lt;Prev</a> <a href="ping4">Next&gt;</a>

ping3: fetch to worker took {{ duration }}ms to say: {{ data.note }}

</code>
</div>
</template>
<style scoped>

code, a { color: Gray }

</style>
