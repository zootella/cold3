<script setup>

let {data, error} = await useFetch('/api/ping/ping3')

</script>
<template>

<div>
<p>ping3: {{ data.note }}</p>
</div>

</template>
