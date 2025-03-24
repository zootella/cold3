<script setup>

import {
log, look, Now, Time, Limit, validateName,
} from 'icarus'
import {ref, watch, onMounted} from 'vue'

let refName = ref('')
let refNameValidStatus = ref('')

/*
let refInFlight = ref(false)//true while we're getting a token and POSTing to our own api, both of those combined
*/
const refButton = ref(null)
const refButtonCanSubmit = ref(false)
const refButtonInFlight = ref(false)

let refResponse = ref('')

watch([refName, refButtonInFlight, refResponse], () => {
	/*
	so here we are in namecomponent2, which we can refactor to:
	1[x]determine if the name is valid to submit, that we can do right here
	2[x]actually check the name, that's in the endpoint
	3[x]remove turnstile from namecomponent2; you can always refer back to namecomponent1, confirm name availability still works
	4[]refactor to use PostButton, removing our use of turnstile
	5[]write and use TurnstileButton, following the turnstile implementation in NameComponent1.vue, read-only

	hide the turnstile widget, and have the texton the page say how long turnstile took to finish and how long the post took, those two, separately
	*/

	let v = validateName(refName.value, Limit.name)
	if (v.isValid) refNameValidStatus.value = `will check "${v.formNormal}" Normal; "${v.formFormal}" Formal; "${v.formPage}" Page`
	else refNameValidStatus.value = 'name not valid to check'

	refButtonCanSubmit.value = v.isValid
})

async function onClick() {
	let f = await refButton.value.clickPerform('/api/name', {
		name: refName.value,
	})
	log(look(f))
	refResponse.value = f
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>NameComponent2</i></p>

<p>Check if your desired username is available. Removed Turnstile, factoring in PostButton.</p>
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
		ref="refButton"
		labelIdle="Check"
		labelFlying="Checking..."
		v-model:inFlight="refButtonInFlight"
		:validToSubmit="refButtonCanSubmit"
		@click-event="onClick"
	/>
</div>
<p>{{refNameValidStatus}}</p>
<p>valid to submit <i>{{refButtonCanSubmit}}</i>, in flight <i>{{refButtonInFlight}}</i></p>
<div><pre>{{refResponse}}</pre></div>

</div>
</template>






























