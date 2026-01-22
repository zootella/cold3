<script setup>//./components/OtpRequestComponent.vue

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
	let response = await fetchWorker('/api/otp', {body: {
		action: 'SendTurnstile.',
		address: refAddress.value,
		provider: refProvider.value,
		envelope: refCookie.value || undefined,
	}})
	log('otp send response', look(response))

	if (response.success) {
		//automatically, an enter box will appear
		refAddress.value = ''
	} else if (response.reason == 'CoolSoft.') {
		//automatically, nothing changes
		pageStore.addNotification("To keep things secure, we can't send another code to that address right away. Wait one minute, and try again, please.")
	} else if (response.reason == 'CoolHard.') {
		//automatically, nothing changes
		pageStore.addNotification("Our system has noticed too much happening too fast. To keep things secure, that address is locked down for 24 hours.")
	} else if (response.reason == 'BadAddress.') {
		pageStore.addNotification("Please enter a valid email address or phone number.")
	} else if (response.reason == 'BadProvider.') {
		pageStore.addNotification("Please select a provider.")
	}
	if (response.envelope !== undefined) refCookie.value = response.envelope
	if (response.otps) pageStore.otps = response.otps
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
