<script setup>

import { ref, reactive, watch } from 'vue'
import {
Sticker, log, look,
} from 'icarus'

let u = Sticker().isCloud ? 'https://api.net23.cc' : 'http://localhost:4000/prod'
u += '/rgl'+'?'+(new URLSearchParams({name: 'r2'}).toString())
const {data, refresh} = useFetch(u, {method: 'GET'})

</script>
<template>

<div>
r2 get to lambda, allow <button @click="refresh">Refresh</button><pre>{{look(data)}}</pre>
</div>

</template>










