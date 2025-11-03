<script setup>

import {
sayTick, hashText,
} from 'icarus'

const refMessage = ref('')//yeah, there's a benefit to making refs const--if you accidentaly set one, and not its .value, you'll know right away
const refHash = ref('')
const refDuration = ref(0)
const refResults = ref('')
const refCount = ref(0)
const refRecent = ref(0)
const refNow = ref('')

const refSearchButton = ref(null); const refSearchEnabled = ref(true); const refSearchInFlight = ref(false)
const refRecordButton = ref(null); const refRecordEnabled = ref(true); const refRecordInFlight = ref(false)
async function onClickSearch() { await onClick('Get.') }
async function onClickRecord() { await onClick('Set.') }

async function onClick(action) {
	if (!hasText(refMessage.value)) refMessage.value = 'yo'

	let t = Now()
	let r
	if      (action == 'Get.') r = await refSearchButton.value.post('/api/trail', {action, message: refMessage.value})
	else if (action == 'Set.') r = await refRecordButton.value.post('/api/trail', {action, message: refMessage.value})
	refNow.value = sayTick(t)
	refDuration.value = Now() - t

	refHash.value = await hashText(refMessage.value)//hash here on the page, as the demo endpoint doesn't return the hash anymore
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
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>TrailDemo</i></p>

<p>
	<input type="text" v-model="refMessage" placeholder="any message, blank becomes yo" class="w-96" />{{' '}}
	<PostButton
		labelIdle="Search" labelFlying="Search" :useTurnstile="false"
		ref="refSearchButton" :canSubmit="refSearchEnabled" v-model:inFlight="refSearchInFlight" :onClick="onClickSearch"
	/>{{' '}}
	<PostButton
		labelIdle="Record" labelFlying="Record" :useTurnstile="false"
		ref="refRecordButton" :canSubmit="refRecordEnabled" v-model:inFlight="refRecordInFlight" :onClick="onClickRecord"
	/>
</p>
<p>fetch at {{refNow}} took {{refDuration}}ms</p>
<p>hashed to <code>{{refHash}}</code></p>
<p>{{refResults}}</p>

</div>
</template>
