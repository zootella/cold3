<script setup>

import {
log, look, Now, sayTick, newline, Data, Tag,
getBrowserTag,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'

let refOutput = ref({})

async function clicked(action) {
	refOutput.value = await $fetch('/api/query', {method: 'POST', body: {action}})
}

</script>
<template>

<div>
	<button @click="clicked('Clear.')">Clear</button>{{' '}}
	<button @click="clicked('Populate.')">Populate</button>{{' '}}
	<button @click="clicked('Query.')">Query</button>
</div>

<pre>{{ refOutput }}</pre>

</template>
