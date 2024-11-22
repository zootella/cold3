<script setup>

import { ref, reactive, watch } from 'vue'
import {
log, look
} from 'icarus'

const {data, refresh} = useFetch('/api/door-lambda', {method: 'POST', body: {name: 'Lima', quantity: 1994, condition: true}})

</script>
<template>

<div>
	<p>door worker to lambda: {{data?.message}} <button @click="refresh">Refresh</button></p>
</div>

</template>
