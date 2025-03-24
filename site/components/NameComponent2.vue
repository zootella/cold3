<script setup>
/*
so here we are in namecomponent2, which we can refactor to:
1[x]determine if the name is valid to submit, that we can do right here
2[x]actually check the name, that's in the endpoint
3[x]remove turnstile from namecomponent2; you can always refer back to namecomponent1, confirm name availability still works
4[x]refactor to use PostButton, removing our use of turnstile
5[]write and use TurnstileButton, following the turnstile implementation in NameComponent1.vue, read-only

hide the turnstile widget, and have the texton the page say how long turnstile took to finish and how long the post took, those two, separately
*/

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

async function onClickParent() {
	let f = await refButton.value.onClickChild('/api/name', {
		name: refName.value,
	})
	log(look(f))
	refResponse.value = f
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>NameComponent2</i></p>

<p>Check if your desired username is available. Using PostButton now with turnstile.</p>
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

		ref="refButton"
		:canSubmit="refButtonCanSubmit"
		v-model:inFlight="refButtonInFlight"

		:useTurnstile="true"
		@click-event="onClickParent"
	/>
</div>
<p>{{refStatus1}}</p>
<p>valid to submit <i>{{refButtonCanSubmit}}</i>, in flight <i>{{refButtonInFlight}}</i></p>
<div><pre>{{refResponse}}</pre></div>

</div>
</template>
