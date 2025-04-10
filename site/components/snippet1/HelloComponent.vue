<script setup>

import {ref, reactive, onMounted} from 'vue'
const helloStore = useHelloStore()

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>HelloComponent</i></p>

<p>browser tag: <code>{{helloStore.browserTag}}</code></p>
<p>hello1 at {{helloStore.sticker1}} took {{helloStore.duration1}}ms</p>
<p>hello2 at {{helloStore.sticker2}} took {{helloStore.duration2}}ms</p>
<p>user:</p><pre>{{helloStore.user}}</pre>
<p>connection: <code>{{helloStore.connection}}</code></p>

</div>
</template>
