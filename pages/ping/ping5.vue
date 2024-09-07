<script setup>

let {data, error} = await useFetch('/api/ping/ping5')

</script>
<template>

<div>
<p>ping5: {{ data.note }}</p>
</div>

</template>
