<script setup>

import { ref, reactive, watch } from 'vue'
import {
log, look
} from 'icarus'

const {data, refresh} = useFetch('/api/dbp', {method: 'POST', body: {name: 'DoorBridgePost', quantity: 2001, condition: true}})

</script>
<template>

<div>
	<p>door bridge post: {{data?.message}} <button @click="refresh">Refresh</button></p>
</div>

</template>
