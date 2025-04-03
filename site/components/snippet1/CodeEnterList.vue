<script setup>

import {
log, look, Now, Limit, sayTick, newline, Data, Tag, hasText,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'
const helloStore = useHelloStore()

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>CodeEnterList</i></p>

<p>this browser has ({{helloStore.codes.length}}) live codes:</p>
<div v-for="code in helloStore.codes" :key="code.codeTag">
	<CodeEnterComponent :code="code" />
</div>

</div>
</template>
