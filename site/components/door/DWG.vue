<script setup>

import {ref, reactive, watch} from 'vue'

const {data, refresh} = useFetch(
	'/api/dwg?' + (new URLSearchParams({
		name: 'DoorWorkerGet',
		quantity: 2002,
		condition: false
	})).toString(),
	{
		method: 'GET'
	}
)


</script>
<template>

<div>
	<p>door worker get: {{ data?.message }} <button @click="refresh">Refresh</button></p>
</div>

</template>
