<script setup>

import {
takeNumerals,
otpPrefix, otpConstants,
} from 'icarus'
const refCookie = useOtpCookie()
const pageStore = usePageStore()

const props = defineProps({
	otp: {type: Object, required: true},
})

const refInstruction = ref('')
const refGuess = ref('')
const refButton = ref(null)

const prefix = await otpPrefix(props.otp.tag, otpConstants.alphabet)

let method
if      (props.otp.address.type == 'Email.') method = 'email'
else if (props.otp.address.type == 'Phone.') method = 'phone'
else                                         method = 'messages'
refInstruction.value = `Check your ${method} for the code we sent`

const computedState = computed(() => {
	return hasText(takeNumerals(refGuess.value)) ? 'ready' : 'ghost'//clickable after even the first number, intentionally
})

async function onClick() {
	let response = await fetchWorker('/api/otp', {body: {action: 'Enter.',
		tag: props.otp.tag,//hidden from the user but kept with the form
		guess: takeNumerals(refGuess.value),
		envelope: refCookie.value,//give the server back it's encrypted envelope, which we kept through a browser refresh in a cookie
	}})
	log('otp enter post response', look(response))
	if (response.success) {
		pageStore.addNotification("✔️ address verified (new otp system)")
	} else if (response.reason == 'Wrong.') {
		//box stays, user can try again; lives is always 1+ here
		//-[]box should indicate incorrect guess, clear the field, tell the user to try again
	} else if (response.reason == 'Expired.') {
		//box will disappear when we set pageStore.otps below
		pageStore.addNotification('code expired or exhausted; request a new code to try again')
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
		v-model="refGuess"
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
