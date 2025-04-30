<script setup>

const {data, refresh} = useFetch(
	host23() + '/gate-post-lambda',
	{
		method: 'POST',
		body: {
			name: 'GatePostLambda.'
		}
	}
)





</script>
<template>

<div>
POST lambda, block
<LinkButton @click="refresh">Refresh</LinkButton><pre>{{look(data)}}</pre>
</div>

</template>
