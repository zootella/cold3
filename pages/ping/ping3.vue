<script setup>

let t = Date.now()
let {data, error} = await useFetch('/api/ping/ping3')
let duration = Date.now() - t

</script>
<template>

<div>
<p>ping3: fetch to worker took {{ duration }}ms to say: {{ data.note }}</p>
</div>

</template>
