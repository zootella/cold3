<script setup>

import { ref, reactive, watch } from 'vue'
import {
Sticker, log, look,
} from 'icarus'

let u = Sticker().isCloud ? 'https://api.net23.cc' : 'http://localhost:4000/prod'
u += '/rpl'
const {data, refresh} = useFetch(u, {method: 'POST', body: {name: 'r4'}})

</script>
<template>

<div>
r4 post to lambda, block
<button @click="refresh">Refresh</button><pre>{{look(data)}}</pre>
</div>

</template>










