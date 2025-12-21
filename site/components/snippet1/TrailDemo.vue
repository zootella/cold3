<script setup>//TrailDemo3.vue - alternative with Button

import {
sayTick, hashText,
} from 'icarus'

const refMessage = ref('hi')
const refHash = ref('')
const refDuration = ref(0)
const refResults = ref('')
const refCount = ref(0)
const refRecent = ref(0)
const refNow = ref('')

const refSearching = ref(false)

const buttonState = computed(() => {
	if (refSearching.value) return 'ghost'//clicked button shows 'doing' via Button's internal state, other shows 'ghost'
	return hasText(refMessage.value) ? 'ready' : 'ghost'
})

async function clicked(action) {
	refSearching.value = true
	let t = Now()
	let r = await fetchWorker('/api/trail', {method: 'POST', body: {action, message: refMessage.value}})
	refNow.value = sayTick(t)
	refDuration.value = Now() - t

	refHash.value = r.hash
	let s = ''
	if (action == 'Get.') {
		s = `${r.count} records in the last 30 seconds`
		if (r.count) s += `; most recent ${Now() - r.recent}ms ago`
	}
	refResults.value = s
	refSearching.value = false
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>TrailDemo</i></p>

<p>
	<input type="text" v-model="refMessage" placeholder="message to hash" class="w-96" />{{' '}}
	<Button :model-value="buttonState" :handler="() => clicked('Get.')">Search</Button>{{' '}}
	<Button :model-value="buttonState" :handler="() => clicked('Set.')">Record</Button>
</p>
<p>fetch at {{refNow}} took {{refDuration}}ms</p>
<p>hashed to <code>{{refHash}}</code></p>
<p>{{refResults}}</p>

</div>
</template>
