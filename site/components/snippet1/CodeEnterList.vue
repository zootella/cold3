<script setup>//./components/CodeEnterList.vue

import {
sayPlural,
} from 'icarus'
const helloStore = useHelloStore()

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>CodeEnterList</i></p>

<p>this browser has ({{helloStore.codes.length}}) live code{{sayPlural(helloStore.codes.length)}}:</p>
<div v-for="r in helloStore.codes" :key="r.tag">
	<CodeEnterComponent :code="r" />
</div>

</div>
</template>
