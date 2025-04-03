<script setup>

import {
log, look, Now, Limit, sayTick, newline, Data, Tag, hasText,
getBrowserTag, isLocal,
validatePhone,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'
const helloStore = useHelloStore()

const refPhone = ref('')
const refOutput = ref('')
const refInFlight = ref(false)
const refButtonState = ref('gray')//gray for ghosted, green for clickable, or orange for in flight

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
			action: 'Send.',
			browserTag: helloStore.browserTag,
			phone: refPhone.value,
		}
	})
	log(look(r))
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>CodeComponent</i></p>

<p><code>{{helloStore.browserTag}}</code> browser tag</p>
<p><code>{{helloStore.user?.userTag}}</code> user tag</p>

<p>
	<input :maxlength="Limit.input"
		type="tel" inputmode="numeric" enterkeyhint="Send Code"
		v-model="refPhone" placeholder="sms number"
		class="w-96"
	/>{{' '}}
	<button
		:disabled="refButtonState != 'green'"
		:class="refButtonState"
		@click="clickedSend"
		class="pushy"
	>Send Code</button>
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
