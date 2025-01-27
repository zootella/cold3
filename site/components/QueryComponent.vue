<script setup>

import {
log, look, Now, sayTick, newline, Data, Tag,
getBrowserTag, isLocal,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'

let refOutput = ref({})

async function clicked(action) {
	if (isLocal({uncertain: 'Cloud.'})) {//running locally for certain
		refOutput.value = await $fetch('/api/query', {method: 'POST', body: {action}})
		log(refOutput.value.result)
	} else {//possibly or definitely deployed to cloud
		refOutput.value = 'local only'
	}
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
