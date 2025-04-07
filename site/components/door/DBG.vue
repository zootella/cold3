<script setup>

import {
Sticker, isLocal, isCloud, log, look,
} from 'icarus'
import {ref, reactive, watch} from 'vue'

const {data, refresh} = useFetch(
	'/api/dbg?' + (new URLSearchParams({
		name: 'DoorBridgeGet',
		quantity: 2000,
		condition: true
	})).toString(),
	{
		method: 'GET'
	}
)


</script>
<template>

<div>
	<p>door bridge get: {{ data?.message }} <button @click="refresh">Refresh</button></p>
</div>

</template>
