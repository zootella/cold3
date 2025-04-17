<script setup>

const {data, refresh} = useFetch(
	'/api/dwp',
	{
		method: 'POST',
		body: {
			name: 'DoorWorkerPost',
			quantity: 2003,
			condition: false
		}
	}
)

</script>
<template>

<div>
	<p>door worker post: {{ data?.message }} <button @click="refresh">Refresh</button></p>
</div>

</template>
