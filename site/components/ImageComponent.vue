<script setup>

import { ref, reactive, watch, computed } from 'vue'
import {
log, look,
} from 'icarus'

let {data} = useFetch('/api/image', {method: 'POST'})
let source = computed(() => data.value?.source || '')
//^not sure what the best pattern is; here's another one!
/*
ttd december, wait a minute, you went round in chat and ended up with what's above
but then you're seeing in ping4.js maybe it's just {{ data.source }}
*/

</script>
<template>

<div>
<img :src="source" />
</div>

</template>
