<script setup>

let t = Date.now()
let {data, error} = await useFetch('/api/ping/ping5')
let duration = Date.now() - t

</script>
<template>

<div>
<p>ping5: fetch to worker to lambda took {{ duration }}ms to say: {{ data.note }}</p>
</div>

</template>
