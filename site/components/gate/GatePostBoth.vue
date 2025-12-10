<script setup>





const {data, refresh} = useFetch(
	'/api/gate/gate-post-worker',
	{
		method: 'POST',
		body: {
			name: 'GatePostWorker.'
		}
	}
)





</script>
<template>

<div>
POST to worker to lambda, allow both
<Button link @click="refresh">Refresh</Button><pre>{{look(data)}}</pre>
</div>

</template>
