<script setup>

import {
origin23,
} from 'icarus'

const {data, refresh} = useFetch(
	origin23() + '/gate-post-lambda',
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
