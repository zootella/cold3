<script setup>

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
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>QueryComponent</i></p>

<div>
	<button class="pushy" @click="clicked('Clear.')">Clear</button>{{' '}}
	<button class="pushy" @click="clicked('Populate.')">Populate</button>{{' '}}
	<button class="pushy" @click="clicked('Query2.')">Query 2</button>{{' '}}
	<button class="pushy" @click="clicked('Query3.')">Query 3</button>
</div>

<pre>{{ refOutput }}</pre>

</div>
</template>
