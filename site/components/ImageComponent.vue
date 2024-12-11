<script setup>

import { ref, reactive, watch, computed } from 'vue'
import {
log, look,
} from 'icarus'

let {data} = useFetch('/api/image', {method: 'POST'})
let source = computed(() => data.value?.source || '')
//^not sure what the best pattern is; here's another one!

</script>
<template>

<div>
<img :src="source" />
</div>

</template>
