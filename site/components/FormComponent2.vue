<script setup>
//./components/FormComponent2.vue

import {
log, look, Now, Limit,
} from 'icarus'
import {ref, watch} from 'vue'
const helloStore = useHelloStore()

const refNote = ref('')

const refButton = ref(null)
const refButtonCanSubmit = ref(false)
const refButtonInFlight = ref(false)

function validateNote(s) {
	if (s.length >= 5) { return {isValid: true,  raw: s} }
	else               { return {isValid: false, raw: s} }
}

watch([refNote, refButtonInFlight], () => {
	let v = validateNote(refNote.value)
	refButtonCanSubmit.value = v.isValid
})

async function onClickParent() {
	log('the user clicked the button...')
	let f = await refButton.value.onClickChild('/api/form', {
		action: 'SubmitNote.',
		browserTag: helloStore.browserTag,
		note: refNote.value,
	})
	log('...the button has finished, returning:', look(f))
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>FormComponent2</i></p>

<p>
	<input
		:maxlength="Limit.input"
		type="text"
		v-model="refNote"
		placeholder="type a note"
		class="w-72"
	/>
	{{' '}}
	<PostButton
		labelIdle="Submit Your Note"
		labelFlying="Note Submitting..."
		:useTurnstile="false"

		ref="refButton"
		:canSubmit="refButtonCanSubmit"
		v-model:inFlight="refButtonInFlight"
		:onClickParent="onClickParent"
	/>
</p>
<p>valid to submit <i>{{refButtonCanSubmit}}</i>, in flight <i>{{refButtonInFlight}}</i></p>

</div>
</template>
