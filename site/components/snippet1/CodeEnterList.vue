<script setup>//./components/CodeEnterList.vue

import {
log, look, Now, Limit, sayTick, newline, Data, Tag, hasText, sayPlural,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'
const codeStore = useCodeStore()

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>CodeEnterList</i></p>

<p>this browser has ({{codeStore.visibleCodes.length}}) live code{{sayPlural(codeStore.visibleCodes.length)}}:</p>
<div v-for="r in codeStore.visibleCodes.slice().reverse()" :key="r.tag">
	<CodeEnterComponent :code="r" />
</div>

</div>
</template>
