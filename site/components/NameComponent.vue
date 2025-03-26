<script setup>//./components/NameComponent.vue

import {
log, look, Now, Time, Limit, validateName,
} from 'icarus'
import {ref, watch, onMounted} from 'vue'

const refName = ref('')
const refStatus1 = ref('')

const refButton = ref(null)
const refButtonCanSubmit = ref(false)
const refButtonInFlight = ref(false)

const refResponse = ref('')

watch([refName], () => {

	let v = validateName(refName.value, Limit.name)
	if (v.isValid) refStatus1.value = `will check "${v.formNormal}" Normal; "${v.formFormal}" Formal; "${v.formPage}" Page`
	else refStatus1.value = ''

	refButtonCanSubmit.value = v.isValid
})
refName.value = 'Name1'//ttd march, so you can hit check immediately to stress test turnstile

async function onClick() {
	let f = await refButton.value.post('/api/name', {
		action: 'Check.',
		name: refName.value,
	})
	log(look(f))
	refResponse.value = f
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>NameComponent</i></p>

<p>Check if your desired username is available. Using PostButton with turnstile at the bottom.</p>
<div>
	<input
		:maxlength="Limit.input"
		type="text"
		v-model="refName"
		placeholder="desired user name or route"
		class="w-72"
	/>
	{{' '}}
	<PostButton
		labelIdle="Check"
		labelFlying="Checking..."
		:useTurnstile="true"

		ref="refButton"
		:canSubmit="refButtonCanSubmit"
		v-model:inFlight="refButtonInFlight"
		:onClick="onClick"
	/>
</div>
<p>{{refStatus1}}</p>
<p>valid to submit <i>{{refButtonCanSubmit}}</i>, in flight <i>{{refButtonInFlight}}</i></p>
<div><pre>{{refResponse}}</pre></div>

</div>
</template>
