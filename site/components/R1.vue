<script setup>

import { ref, reactive, watch } from 'vue'
import {
log, look,
} from 'icarus'

const {data, refresh} = useFetch('/api/rpw', {method: 'POST', body: {name: 'r1'}})



</script>
<template>

<div>
r1 post to worker to lambda, allow both <button @click="refresh">Refresh</button><pre>{{look(data)}}</pre>
</div>

</template>
