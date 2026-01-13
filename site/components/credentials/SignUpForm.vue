<script setup>
/*
SignUpForm.vue - sign up form for new users

Shows: ChooseNameForm for name, SetPasswordForm for password (with confirmation), Sign Up button
Modes: single mode; button is ghost until name and password both valid
Parent: just render <SignUpForm />, no props needed
Server contact: on submit, hashes password via SetPasswordForm.hash(), then calls signUpAndSignIn (turnstile protected)
End state: on success, credentialStore refreshes and user is signed in; shows error on name collision or other failure
Nested: ChooseNameForm exposes valid/name1/name2; SetPasswordForm used with hideButton, exposes valid/hash()
*/

import {
} from 'icarus'

const credentialStore = useCredentialStore()

const refChooseName = ref(null)
const refSetPassword = ref(null)
const refButton = ref(null)
const refOutput = ref('')

const computedValid = computed(() => {
	return refChooseName.value?.valid && refSetPassword.value?.valid
})

async function onSignUp() {
	if (!computedValid.value) return

	refOutput.value = 'Creating account...'

	//get turnstile token
	let turnstileToken = await refButton.value.getTurnstileToken()

	//hash password
	let {newHash, newCycles} = await refSetPassword.value.hash()

	//sign up and sign in
	refOutput.value = 'Signing up...'
	let task = await credentialStore.signUpAndSignIn({
		name1: refChooseName.value.name1,
		name2: refChooseName.value.name2,
		hash: newHash,
		cycles: newCycles,
		turnstileToken,
	})

	if (task.success) {
		refOutput.value = 'Signed up!'
	} else if (task.outcome == 'NameNotAvailable.') {
		refOutput.value = 'That name is not available, please choose another.'
	} else {
		refOutput.value = `Error: ${task.outcome}`
	}
}

</script>
<template>
<div>

<ChooseNameForm ref="refChooseName" />

<div class="mt-4">
	<SetPasswordForm ref="refSetPassword" :cycles="0" :hideButton="true" />
</div>

<p class="mt-2">
<Button
	ref="refButton"
	:useTurnstile="true"
	labeling="Signing up..."
	:click="onSignUp"
	:state="computedValid ? 'ready' : 'ghost'"
>Sign Up</Button>
</p>

<p v-if="refOutput">{{ refOutput }}</p>

</div>
</template>
