<script setup>

import {
host23,
} from 'icarus'

const {data, refresh} = useFetch(
	host23() + '/gate-get-lambda?' + (new URLSearchParams({
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
