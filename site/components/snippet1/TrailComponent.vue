<script setup>

import {
sayTick,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'

const refMessage = ref('')//yeah, there's a benefit to making refs const--if you accidentaly set one, and not its .value, you'll know right away
const refHash = ref('')
const refDuration = ref(0)
const refResults = ref('')
const refCount = ref(0)
const refRecent = ref(0)
const refNow = ref('')

async function clicked(action) {
	if (!hasText(refMessage.value)) refMessage.value = 'yo'

	let t = Now()
	let r = await $fetch('/api/trail', {method: 'POST', body:
		{action, message: refMessage.value}})
	refNow.value = sayTick(t)
	refDuration.value = Now() - t

	refHash.value = r.hash
	let s = ''
	if (action == 'Get.') {
		s = `${r.count} records in the last 30 seconds`
		if (r.count) s += `; most recent ${Now() - r.recent}ms ago`
	}
	refResults.value = s
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>TrailComponent</i></p>

<p>
	<input type="text" v-model="refMessage" placeholder="any message, blank becomes yo" class="w-96" />{{' '}}
	<button @click="clicked('Get.')" class="pushy">Search</button>{{' '}}
	<button @click="clicked('Set.')" class="pushy">Record</button>
</p>
<p>fetch at {{refNow}} took {{refDuration}}ms</p>
<p>hashed to <code>{{refHash}}</code></p>
<p>{{refResults}}</p>

</div>
</template>
