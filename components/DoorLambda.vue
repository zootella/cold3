<script setup>

import { ref, reactive, watch } from 'vue'
import { log, look, Now } from '@/library/library0.js'

const {data, refresh} = useFetch('/api/door-lambda', {method: 'POST', body: {name: 'Lucy', age: 21}})

</script>
<template>

<div>
	<p>door worker to lambda: data is {{data?.message}} and {{data?.when}} <button @click="refresh">Refresh</button></p>
</div>

</template>
