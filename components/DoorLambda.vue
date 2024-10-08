<script setup>

import { ref, reactive, watch } from 'vue'
import {
log, look
} from '@/library/grand.js'

const {data, refresh} = useFetch('/api/door-lambda', {method: 'POST', body: {name: 'Lucy', age: 21}})

</script>
<template>

<div>
	<p>door worker to lambda: data is {{data?.message}} <button @click="refresh">Refresh</button></p>
</div>

</template>
