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

const refState = ref('ready')

watch([refMessage, refState], () => {
	if      (refState.value == 'ghost' && hasText(refMessage.value))  { refState.value = 'ready' }
	else if (refState.value == 'ready' && !hasText(refMessage.value)) { refState.value = 'ghost' }
})//either button could return from doing, and the user could be clearing or typing in the box, so from all that chaos, looking for th eright simple water-tight way to keep the button green only when there's message text in the box and no fetch in flight, essentially

async function clicked(action) {
	refState.value = 'doing'

	let t = Now()
	let r = await fetchWorker('/api/trail', {method: 'POST', body: {action, message: refMessage.value}})
	refNow.value = sayTick(t)
	refDuration.value = Now() - t
	/*
	ok, now we'd like to add a feature
	while we're awaiting fetchWorker (in practice it takes ~300ms, but imagine it could be longer)

	[]set both buttons orange while we're in this function
	[]set both buttons gray when there's no text in the box
	*/

	refHash.value = r.hash
	let s = ''
	if (action == 'Get.') {
		s = `${r.count} records in the last 30 seconds`
		if (r.count) s += `; most recent ${Now() - r.recent}ms ago`
	}
	refResults.value = s

	refState.value = hasText(refMessage.value) ? 'ready' : 'ghost'
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>TrailDemo</i></p>

<p>
	<input type="text" v-model="refMessage" placeholder="message to hash" class="w-96" />{{' '}}
	<Button v-model="refState" @click="clicked('Get.')">Search</Button>{{' '}}
	<Button v-model="refState" @click="clicked('Set.')">Record</Button>
</p>
<p>fetch at {{refNow}} took {{refDuration}}ms</p>
<p>hashed to <code>{{refHash}}</code></p>
<p>{{refResults}}</p>

</div>
</template>
