<script setup>

import {
log, look, Now, Limit, sayTick, newline, Data, Tag, hasText,
getBrowserTag, isLocal,
validatePhone, validateEmail, validateEmailOrPhone,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'
const helloStore = useHelloStore()

const refAddress = ref('')
const refProvider = ref('')
const refOutput = ref('')
const refInFlight = ref(false)
const refButtonState = ref('gray')//gray for ghosted, green for clickable, or orange for in flight

watch([refAddress, refProvider, refInFlight], () => {
	let v = validateEmailOrPhone(refAddress.value)

	if      (v.isValid && v.type == 'Email.') { refOutput.value = `valid email ${v.formPage}` }
	else if (v.isValid && v.type == 'Phone.') { refOutput.value = `valid phone ${v.formPage}` }
	else                                      { refOutput.value = 'type a valid email or phone' }

	if (refInFlight.value) { refButtonState.value = 'orange' }
	else if (v?.isValid && hasText(refProvider.value)) { refButtonState.value = 'green' }
	else { refButtonState.value = 'gray' }
})

async function clickedSend() {
	try {

		let r = await $fetch('/api/code', {
			method: 'POST',
			body: {
				action: 'Send.',
				browserTag: helloStore.browserTag,
				address: refAddress.value,
				provider: refProvider.value,
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
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>CodeRequestComponent</i></p>


<p>
	<input :maxlength="Limit.input" type="text" v-model="refAddress" placeholder="email or phone" class="w-64" />{{' '}}
	<input :maxlength="Limit.input" type="text" v-model="refProvider" placeholder="provider" class="w-12" />{{' '}}
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
