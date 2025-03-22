<script setup>

import {
log, look, Now, Limit,
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

async function clickedButton() {
	let f = await buttonFetch({
		inFlight: refInFlight,//give the buttonFetch function the reference to our inFlight, so it can enable and color the button correctly
		path: '/api/form',
		body: {
			action: 'SubmitNote.',
			browserTag: helloStore.browserTag,
			note: refNote.value,
		},
	})
	log(look(f))
}

async function buttonFetch({inFlight, path, body}) {
	let result, error, success = true
	let t1 = Now()
	try {
		inFlight.value = true
		result = await $fetch(path, {method: 'POST', body})
	} catch (e) {
		error = e
		success = false
	} finally {
		inFlight.value = false
	}
	let t2 = Now()
	return {p: {success, result, error, tick: t2, duration: t2 - t1}}
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>FormComponent</i></p>

<p>
	<input :maxlength="Limit.input" type="text" v-model="refNote" placeholder="type a note" class="w-72" />
	{{' '}}
	<button
		:disabled="refButtonState != 'green'"
		:class="refButtonState"
		class="pushy"
		@click="clickedButton"
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
