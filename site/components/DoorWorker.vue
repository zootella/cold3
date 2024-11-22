<script setup>

import { ref, reactive, watch } from 'vue'
import {
log, look
} from 'icarus'

const {data, refresh} = useFetch('/api/door', {method: 'POST', body: {name: 'Whiskey', quantity: 2009, condition: false}})

</script>
<template>

<div>
	<p>door worker: {{data?.message}} <button @click="refresh">Refresh</button></p>
</div>

</template>
