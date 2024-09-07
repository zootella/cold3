<script setup>

let t = Date.now()
let {data, error} = await useFetch('/api/ping/ping5')
let duration = Date.now() - t

</script>
<template>

<div>
<p>ping5: {{ data.note }}, page in {{ duration }}ms</p>
</div>

</template>
