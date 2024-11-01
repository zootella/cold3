<script setup>

let t = Date.now()
let {data, error} = await useFetch('/api/ping/ping4')
let duration = Date.now() - t

</script>
<template>
<div>
<code>
<a href="ping3">&lt;Prev</a> <a href="ping5">Next&gt;</a>

ping4: fetch to worker to database took {{ duration }}ms to say: {{ data.note }}

</code>
</div>
</template>
<style scoped>

code, a { color: Gray }

</style>
