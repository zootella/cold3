<script setup>

import {
validateEmailOrPhone, toBoolean,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'
const helloStore = useHelloStore()

const refButton = ref(null)
const refButtonCanSubmit = ref(false)//set to true to let the button be clickable, the button below is watching
const refButtonInFlight = ref(false)//the button below sets to true while it's working, we can watch

const refAddress = ref('')
const refProvider = ref('')

watch([refAddress, refProvider], () => {
	let v = validateEmailOrPhone(refAddress.value)
	refButtonCanSubmit.value = toBoolean(v.isValid && hasText(refProvider.value))
})

async function onClick() {
	let result = await refButton.value.post('/api/code/send', {
		address: refAddress.value,
		provider: refProvider.value,
	})
	log('code send post result', look(result))
	helloStore.setCodes(result.response.codes)
	/*
	response
	.success true - code sent, and there will be a new record about it in the store; this box can disappear
	.success false - code not sent
		.reason CoolSoft.
		.reason CoolHard.
	*/
	if (result.response.success) {
		log('reached 1, code sent successfully, so now this box should hide')//[x]
	} else if (result.response.reason == 'CoolSoft.') {
		log('reached 2, cant send a code right now, wait 5 minutes')//[x]
	} else if (result.response.reason == 'CoolHard.') {
		log('reached 3, cant send a code right now, wait 24 hours')
		//all three of these are, the controls switch to a message, and clicking the box closes it
	} else {
		log('SOME OTHER OUTCOME')
	}
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

</div>
</template>
