<script setup>

const {data, refresh} = useFetch(
	'/api/gate-get-worker?' + (new URLSearchParams({
		name: 'GateGetWorker.'
	})).toString(),
	{
		method: 'GET'
	}
)






</script>
<template>

<div>
GET worker, block
<LinkButton @click="refresh">Refresh</LinkButton><pre>{{look(data)}}</pre>
</div>

</template>
