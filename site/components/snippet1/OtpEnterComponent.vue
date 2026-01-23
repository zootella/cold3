<script setup>//./components/OtpEnterComponent.vue

import {
takeNumerals,
hashToLetter, validateEmailOrPhone, Code,
} from 'icarus'
const refCookie = useOtpCookie()
const pageStore = usePageStore()

const props = defineProps({
	otp: {type: Object, required: true},
})

const refInstruction = ref('')
const refOtpCandidate = ref('')
const refButton = ref(null)

const prefix = await hashToLetter(props.otp.tag, Code.alphabet)
const addressType = validateEmailOrPhone(props.otp.f2).type

let method
if      (addressType == 'Email.') method = 'email'
else if (addressType == 'Phone.') method = 'phone'
else                              method = 'messages'
refInstruction.value = `Check your ${method} for the code we sent`

const computedState = computed(() => {
	return hasText(takeNumerals(refOtpCandidate.value)) ? 'ready' : 'ghost'//clickable after even the first number, intentionally
})

async function onClick() {
	let response = await fetchWorker('/api/otp', {body: {action: 'Enter.',
		otpTag: props.otp.tag,//hidden from the user but kept with the form
		otpCandidate: takeNumerals(refOtpCandidate.value),
		envelope: refCookie.value,//give the server back it's encrypted envelope, which we kept through a browser refresh in a cookie
	}})
	log('otp enter post response', look(response))
	if (response.success) {
		//automatically, this box will disappear when we set pageStore.otps below, ttd january
		pageStore.addNotification("✔️ address verified (new otp system)")
	} else if (response.reason == 'Wrong.' && response.lives) {
		//automatically, nothing changes
		//-[]box should indicate incorrect guess, clear the field, tell the user to try again
	} else if (response.reason == 'Wrong.' && response.lives == 0) {
		//automatically, this box will disappear when we set pageStore.otps below
		pageStore.addNotification('code incorrect; request a new code to try again')
	} else if (response.reason == 'Expired.') {
		//automatically, this box will disappear when we set pageStore.otps below
		pageStore.addNotification('code expired; request a new code to try again')
	}
	refCookie.value = hasText(response.envelope) ? response.envelope : null//update or clear the temporary envelope cookie
	pageStore.otps = response.otps
}
function clickedCantFind() {
	log('clicked cant find')
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>OtpEnterComponent</i></p>

<p>{{refInstruction}}</p>
<p>
	Code {{prefix}}
	<input :maxlength="Limit.input"
		type="tel" inputmode="numeric" enterkeyhint="Enter"
		v-model="refOtpCandidate"
		class="w-32"
		@keyup.enter="refButton.click()"
	/>{{' '}}
	<Button
		ref="refButton"
		:state="computedState"
		:click="onClick"
		labeling="Verifying..."
	>Enter</Button>
</p>
<p><Button link :click="clickedCantFind">I can't find it</Button></p>

</div>
</template>
