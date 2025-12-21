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
<Button link :click="refresh">Refresh</Button><pre>{{look(data)}}</pre>
</div>

</template>
