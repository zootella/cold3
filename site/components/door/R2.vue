<script setup>

import {
host23,
} from 'icarus'
import {ref, reactive, watch} from 'vue'

const {data, refresh} = useFetch(
	host23() + '/rgl?' + (new URLSearchParams({
		name: 'r2'
	})).toString(),
	{
		method: 'GET'
	}
)






</script>
<template>

<div>
r2 get to lambda, block
<button class="pushy" @click="refresh">Refresh</button><pre>{{ look(data) }}</pre>
</div>

</template>
