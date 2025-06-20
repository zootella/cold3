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
<LinkButton @click="refresh">Refresh</LinkButton><pre>{{look(data)}}</pre>
</div>

</template>
