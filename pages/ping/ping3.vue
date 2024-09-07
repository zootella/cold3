<script setup>

let t = Date.now()
let {data, error} = await useFetch('/api/ping/ping3')
let duration = Date.now() - t

</script>
<template>

<div>
<p>ping3: {{ data.note }}, page in {{ duration }}ms</p>
</div>

</template>
