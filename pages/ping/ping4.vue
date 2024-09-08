<script setup>

let t = Date.now()
let {data, error} = await useFetch('/api/ping/ping4')
let duration = Date.now() - t

</script>
<template>

<div>
<p>ping4: fetch to worker to database took {{ duration }}ms to say: {{ data.note }}</p>
</div>

</template>
