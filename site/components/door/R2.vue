<script setup>

import {
Sticker, isLocal, isCloud, log, look, urlNetwork23,
} from 'icarus'
import {ref, reactive, watch} from 'vue'

const {data, refresh} = useFetch(
	urlNetwork23() + '/rgl?' + (new URLSearchParams({
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
