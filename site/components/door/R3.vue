<script setup>

import {
isLocal, isCloud, log, look,
} from 'icarus'
import {ref, reactive, watch} from 'vue'

const {data, refresh} = useFetch(
	'/api/rgw?' + (new URLSearchParams({
		name: 'r3'
	})).toString(),
	{
		method: 'GET'
	}
)






</script>
<template>

<div>
r3 get to worker, block
<button class="pushy" @click="refresh">Refresh</button><pre>{{ look(data) }}</pre>
</div>

</template>
