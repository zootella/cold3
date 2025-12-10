<script setup>





const {data, refresh} = useFetch(
	'/api/gate/gate-get-worker?' + (new URLSearchParams({
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
<Button link @click="refresh">Refresh</Button><pre>{{look(data)}}</pre>
</div>

</template>
