<script setup>

import {
log, look,
} from 'icarus'
import { ref, reactive, watch, computed } from 'vue'

let {data, error} = useFetch('/api/image', {method: 'POST'})

</script>
<template>

<div>
<p><img :src="data.source" :alt="data.sticker" /></p>
<p>signed by <i>{{ data.sticker }}</i></p>
</div>

</template>
