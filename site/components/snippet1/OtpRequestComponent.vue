<script setup>

import {
validateEmailOrPhone,
} from 'icarus'
const pageStore = usePageStore()
const refCookie = useOtpCookie()

const refButton = ref(null)

const refAddress = ref('')
const refProvider = ref('')

const computedState = computed(() => {
	let v = validateEmailOrPhone(refAddress.value)
	return (v.ok && hasText(refProvider.value)) ? 'ready' : 'ghost'
})

async function onClick() {
	let response = await refButton.value.post('/api/otp', {
		action: 'SendTurnstile.',
		address: refAddress.value,
		provider: refProvider.value,
		envelope: refCookie.value || undefined,
	})
	log('otp send post response', look(response))

	if (response.success) {
		//automatically, an enter box will appear
		//- collapse the controls in this box, as the user doesn't need to use them again
	} else if (response.reason == 'CoolSoft.') {
		//automatically, nothing changes
		//- collapse the controls in this box, as the user can't use them for another minute
		pageStore.addNotification("To keep things secure, we can't send another code to that address right away. Wait one minute, and try again, please.")//ttd january, it may instead make sense to write that into the enter box, letting them choose a different address, or something
	} else if (response.reason == 'CoolHard.') {
		//automatically, nothing changes
		//- collapse the controls in this box, as the user can't use them for another minute
		pageStore.addNotification("Our system has noticed too much happening too fast. To keep things secure, that address is locked down for 24 hours.")
	}
	refCookie.value = hasText(response.envelope) ? response.envelope : null//update or clear the temporary envelope cookie
	pageStore.otps = response.otps
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>OtpRequestComponent</i></p>

<p>
	<input :maxlength="Limit.input" type="text" v-model="refAddress" placeholder="email or phone" class="w-64" />{{' '}}
	<input :maxlength="Limit.input" type="text" v-model="refProvider" placeholder="provider" class="w-12" @keyup.enter="refButton.click()" />{{' '}}
	<Button
		ref="refButton"
		:state="computedState"
		:click="onClick"
		:useTurnstile="true"
		labeling="Sending..."
	>Send Code</Button>
</p>

</div>
</template>
