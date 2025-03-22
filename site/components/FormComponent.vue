<script setup>

import {
log, look, Now, Limit, sayTick, newline, Data, Tag, hasText,
getBrowserTag, isLocal,
validatePhone, validateEmail, validateEmailOrPhone,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'
const helloStore = useHelloStore()

const refNote = ref('')
const refInFlight = ref(false)
const refButtonState = ref('gray')//gray for ghosted, green for clickable, or orange for in flight

function validateNote(s) {
	if (s.length >= 5) { return {isValid: true,  raw: s} }
	else               { return {isValid: false, raw: s} }
}

watch([refNote, refInFlight], () => {
	let v = validateNote(refNote.value)

	if (refInFlight.value) { refButtonState.value = 'orange' }
	else if (v.isValid) { refButtonState.value = 'green' }
	else { refButtonState.value = 'gray' }
})

async function clickedSend() {
	try {

		let r = await $fetch('/api/form', {
			method: 'POST',
			body: {
				action: 'SubmitNote.',
				browserTag: helloStore.browserTag,
				note: refNote.value,
			}
		})
		log(look(r))

	} catch (e) {
		log('did you catch it?', look(e))//ttd march []try throwing exceptions all the way down the stack, and []needing this catch around fetch is a reason to make <PostButton /> and <TurnstilePostButton />
	}
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>FormComponent</i></p>

<p>
	<input :maxlength="Limit.input" type="text" v-model="refNote" placeholder="type a note" class="w-72" />{{' '}}
	<button
		:disabled="refButtonState != 'green'"
		:class="refButtonState"
		class="pushy"
		@click="clickedSend"
	>Submit Your Note</button>
</p>

</div>
</template>
<style scoped>

button.gray        { background-color: gray;       }
button.green       { background-color: green;      }
button.green:hover { background-color: lightgreen; }
button.orange      { background-color: orange;     }

</style>
