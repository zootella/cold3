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
	<button class="pushy" @click="clicked('Clear.')">Clear</button>{{' '}}
	<button class="pushy" @click="clicked('Populate.')">Populate</button>{{' '}}
	<button class="pushy" @click="clicked('Query2.')">Query 2</button>{{' '}}
	<button class="pushy" @click="clicked('Query3.')">Query 3</button>
</div>

<pre>{{ refOutput }}</pre>

</template>
