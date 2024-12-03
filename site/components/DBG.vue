<script setup>

import { ref, reactive, watch } from 'vue'
import {
log, look
} from 'icarus'

const {data, refresh} = useFetch('/api/dbg?'+(new URLSearchParams({name: 'DoorBridgeGet', quantity: 2000, condition: true}).toString()), {method: 'GET'})

</script>
<template>

<div>
	<p>door bridge get: {{data?.message}} <button @click="refresh">Refresh</button></p>
</div>

</template>
