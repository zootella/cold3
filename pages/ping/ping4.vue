<script setup>

let {data, error} = await useFetch('/api/ping/ping4')

</script>
<template>

<div>
<p>ping4: {{ data.note }}</p>
</div>

</template>
