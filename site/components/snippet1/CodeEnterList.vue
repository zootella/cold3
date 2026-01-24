<script setup>

import {
sayPlural,
} from 'icarus'
const mainStore = useMainStore()

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>CodeEnterList</i></p>

<p>this browser has ({{mainStore.codes.length}}) live code{{sayPlural(mainStore.codes.length)}}:</p>
<div v-for="r in mainStore.codes" :key="r.tag">
	<CodeEnterComponent :code="r" />
</div>

</div>
</template>
