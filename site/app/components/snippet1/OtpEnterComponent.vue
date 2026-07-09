<script setup>

import {
takeNumerals,
otpPrefix, otpConstants,
} from 'icarus'
const credentialStore = useCredentialStore()
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
	let task = await credentialStore.otpEnter({
		tag: props.otp.tag,//hidden from the user but kept with the form
		guess: takeNumerals(refGuess.value),
	})
	log('otp enter task', look(task))
	if (task.success) {
		pageStore.addNotification("✔️ address verified (new otp system)")
	} else if (task.outcome == 'Wrong.') {
		//box stays, user can try again; lives is always 1+ here
		//-[]box should indicate incorrect guess, clear the field, tell the user to try again
	} else if (task.outcome == 'Expired.') {
		//box will disappear when the store's challenge list updates
		pageStore.addNotification('code expired or exhausted; request a new code to try again')
	} else if (task.outcome == 'Held.') {
		//box will disappear the same way; the challenge is dead because the address is spoken for
		pageStore.addNotification("That address can't be verified right now.")
	} else if (task.outcome == 'SignedOut.') {
		//box stays; the challenge is still live for the user who started it
		pageStore.addNotification("Sign in as the account that requested this code, then try again.")
	}
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
