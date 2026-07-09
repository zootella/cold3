<script setup>

import {
validateEmailOrPhone,
} from 'icarus'
const credentialStore = useCredentialStore()
const pageStore = usePageStore()

const props = defineProps({
	type: {type: String, default: ''},//blank accepts email or phone, like the demo; 'Email.' or 'Phone.' restricts, for a panel that adds one kind
})

const refButton = ref(null)

const refAddress = ref('')
const refProvider = ref('')

const computedState = computed(() => {
	if (!credentialStore.userTag) return 'ghost'//otp flows require being signed in, the whole time; the box is inert until then
	let v = validateEmailOrPhone(refAddress.value)
	if (!v.ok) return 'ghost'
	if (props.type && v.type != props.type) return 'ghost'//valid, but not the kind of address this box is for
	return hasText(refProvider.value) ? 'ready' : 'ghost'
})

async function onClick() {
	let turnstileToken = await refButton.value.getTurnstileToken()
	let task = await credentialStore.otpSend({
		address: refAddress.value,
		provider: refProvider.value,
		turnstileToken,
	})
	log('otp send task', look(task))

	if (task.success) {
		refAddress.value = ''//the code is on its way, and the enter box appears from the store's challenge list
		//- collapse the controls in this box, as the user doesn't need to use them again
	} else if (task.outcome == 'CoolSoft.') {
		//automatically, nothing changes
		//- collapse the controls in this box, as the user can't use them for another minute
		pageStore.addNotification("To keep things secure, we can't send another code to that address right away. Wait one minute, and try again, please.")//ttd january, it may instead make sense to write that into the enter box, letting them choose a different address, or something
	} else if (task.outcome == 'CoolHard.') {
		//automatically, nothing changes
		//- collapse the controls in this box, as the user can't use them for another minute
		pageStore.addNotification("Our system has noticed too much happening too fast. To keep things secure, that address is locked down for 24 hours.")
	} else if (task.outcome == 'Held.') {
		pageStore.addNotification("That address can't be verified right now.")//deliberately vague; naming the real reason, that another account holds this address, would confirm to a stranger that the address is registered here
	} else if (task.outcome == 'SignedOut.') {
		//the button was ready, so this tab believed someone was signed in, but the server says nobody is--the spa has caught itself stale, likely a sign out in another tab or from another device
		window.location.href = '/'//the middle road: end the spa with a full navigation home, rebuilding everything from server truth; short of blowing up with error, but not continuing on state we know is wrong
	}
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>OtpRequestComponent</i></p>

<p>
	<input :maxlength="Limit.input" type="text" v-model="refAddress" :placeholder="type == 'Email.' ? 'email' : type == 'Phone.' ? 'phone' : 'email or phone'" class="w-64" />{{' '}}
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
