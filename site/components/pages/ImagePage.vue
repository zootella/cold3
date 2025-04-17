<script setup>

let {data, error} = useFetch('/api/image', {method: 'POST'})

watch([data], () => {

	log(`watch on data seeing ${look(data.value)}`)

}, {immediate: true})


</script>
<template>

<div>
<p><img :src="data?.source" :alt="data?.sticker" /></p>
<p>signed by <i>{{ data?.sticker }}</i></p>
</div>

</template>
