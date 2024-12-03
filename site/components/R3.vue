<script setup>

import { ref, reactive, watch } from 'vue'
import {
log, look,
} from 'icarus'

const {data, refresh} = useFetch('/api/rgw?'+(new URLSearchParams({name: 'r3'}).toString()), {method: 'GET'})



</script>
<template>

<div>
r3 get to worker, block <button @click="refresh">Refresh</button><pre>{{look(data)}}</pre>
</div>

</template>
