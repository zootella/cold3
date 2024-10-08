<script setup>

import { ref, reactive, watch } from 'vue'
import {
log, look
} from '@/library/grand.js'

const {data, refresh} = useFetch('/api/door', {method: 'POST', body: {name: 'Wendy', age: 31}})

</script>
<template>

<div>
	<p>door worker: data is {{data?.message}} <button @click="refresh">Refresh</button></p>
</div>

</template>
