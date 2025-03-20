<script setup>

import {
log, look, Now, Limit, sayTick, newline, Data, Tag, hasText,
getBrowserTag, isLocal,
validatePhone,
onlyNumerals, Code, hashToLetter,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'
const helloStore = useHelloStore()

const refPhone = ref('')
const refInstruction = ref('example instruction')
const refOutput = ref('example output')
const refInFlight = ref(false)
const refButtonState = ref('gray')//gray for ghosted, green for clickable, or orange for in flight

const refLetter = ref('D')
/*
await hashToLetter(c.codeTag, Code.alphabet)
*/

watch([refPhone], () => {
	let v = validatePhone(refPhone.value)
	refOutput.value = v

	if (refInFlight.value) { refButtonState.value = 'orange' }
	else if (v.isValid) { refButtonState.value = 'green' }
	else { refButtonState.value = 'gray' }
})

async function clickedSend() {
	let r = await $fetch('/api/code', {
		method: 'POST',
		body: {
			action: 'Enter.',
			browserTag: helloStore.browserTag,
			codeTag: refCodeTag.value,//hidden from the user but kept with the form
			codeEntered: refCode.value,
		}
	})
	log(look(r))
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>CodeEnterComponent</i></p>

<p>{{refInstruction}}</p>
<p>
	Code {{refLetter}}
	<input :maxlength="Limit.input"
		type="tel" inputmode="numeric" enterkeyhint="Enter"
		v-model="refPhone"
		class="w-32"
	/>{{' '}}
	<button
		:disabled="refButtonState != 'green'"
		:class="refButtonState"
		@click="clickedSend"
		class="pushy"
	>Enter</button>
</p>

<p>{{refOutput}}</p>

</div>
</template>
<style scoped>

button.gray        { background-color: gray;       }
button.green       { background-color: green;      }
button.green:hover { background-color: lightgreen; }
button.orange      { background-color: orange;     }

</style>
