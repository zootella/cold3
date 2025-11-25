<script setup>

import {
origin23,
} from 'icarus'

const {data, refresh} = useFetch(
	origin23() + '/gate-get-lambda?' + (new URLSearchParams({
		name: 'GateGetLambda.'
	})).toString(),
	{
		method: 'GET'
	}
)






</script>
<template>

<div>
GET lambda, block
<LinkButton @click="refresh">Refresh</LinkButton><pre>{{look(data)}}</pre>
</div>

</template>
