<script setup>

import {
log, look, Now, Limit, sayTick, newline, Data, Tag, hasText,
validatePhone, validateEmail, validateEmailOrPhone,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'
const helloStore = useHelloStore()

const refButton = ref(null)
const refButtonCanSubmit = ref(false)//set to true to let the button be clickable, the button below is watching
const refButtonInFlight = ref(false)//the button below sets to true while it's working, we can watch

const refAddress = ref('')
const refProvider = ref('')
const refOutput = ref('')

watch([refAddress, refProvider], () => {
	let v = validateEmailOrPhone(refAddress.value)

	if      (v.isValid && v.type == 'Email.') { refOutput.value = `valid email ${v.formPage}` }
	else if (v.isValid && v.type == 'Phone.') { refOutput.value = `valid phone ${v.formPage}` }
	else                                      { refOutput.value = 'type a valid email or phone' }

	refButtonCanSubmit.value = !!(v.isValid && hasText(refProvider.value))
})

async function onClick() {
	let task = await refButton.value.post('/api/code/send', {
		address: refAddress.value,
		provider: refProvider.value,
	})
	log("CodeRequestComponent's onClick got this task from the post:", look(task))
	task.response.codes
	helloStore.codesMerge(task.response.codes)

	//ok, here's where you merge in response.codes
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>CodeRequestComponent</i></p>

<p>
	<input :maxlength="Limit.input" type="text" v-model="refAddress" placeholder="email or phone" class="w-64" />{{' '}}
	<input :maxlength="Limit.input" type="text" v-model="refProvider" placeholder="provider" class="w-12" />{{' '}}
	<PostButton
		labelIdle="Send Code"
		labelFlying="Sending..."
		:useTurnstile="true"

		ref="refButton"
		:canSubmit="refButtonCanSubmit"
		v-model:inFlight="refButtonInFlight"
		:onClick="onClick"
	/>
</p>

<p>{{refOutput}}</p>

</div>
</template>
