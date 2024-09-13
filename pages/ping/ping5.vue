<script setup>

let t = Date.now()
let {data, error} = await useFetch('/api/ping/ping5')
let duration = Date.now() - t

</script>
<template>
<div>
<code>
<a href="ping4">&lt;Prev</a> Next&gt;

ping5: fetch to worker to lambda took {{ duration }}ms to say: {{ data.note }}

</code>
</div>
</template>
<style scoped>

code, a { color: Gray }

</style>
