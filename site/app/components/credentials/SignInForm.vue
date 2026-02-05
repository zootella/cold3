<script setup>
/*
SignInForm.vue - sign in form for returning users

Shows: username input, password input (PasswordBox), Sign In button
Modes: single mode; button is ghost until both fields valid, then ready
Parent: just render <SignInForm />, no props needed
Server contact: on submit, calls getPasswordCycles (turnstile protected) then signIn
       two API calls hidden behind one button; user sees single "Signing in..." flow
End state: on success, credentialStore refreshes and parent can react; shows error message on failure
Validation: uses validateName to check userIdentifier resolves to valid f0
*/

import {
validateName,
passwordHash,
Data,
} from 'icarus'

const credentialStore = useCredentialStore()

const refUserIdentifier = ref('')
const refPassword = ref('')
const refOutput = ref('')
const refButton = ref(null)

const computedValid = computed(() => {
	let v = validateName(refUserIdentifier.value, Limit.name)
	return v.ok && refPassword.value.length > 0
})

async function onSignIn() {
	refOutput.value = 'Signing in...'

	//get turnstile token
	let turnstileToken = await refButton.value.getTurnstileToken()

	//get cycles for this user's password
	let cyclesTask = await credentialStore.getPasswordCycles({userIdentifier: refUserIdentifier.value, turnstileToken})
	if (!cyclesTask.success) {
		refOutput.value = 'Incorrect username or password'
		return
	}

	//hash password with user's cycles
	refOutput.value = 'Verifying...'
	let hash = await passwordHash({
		passwordText: refPassword.value,
		cycles: cyclesTask.cycles,
		saltData: Data({base62: Key('password, salt, public')}),
	})

	//sign in
	let signInTask = await credentialStore.signIn({userIdentifier: refUserIdentifier.value, hash})
	if (signInTask.success) {
		refOutput.value = 'Signed in!'
		refUserIdentifier.value = ''
		refPassword.value = ''
	} else {
		refOutput.value = 'Incorrect username or password'
	}
}

</script>
<template>
<div>

<p>Your user name:</p>
<input :maxlength="Limit.name" v-model="refUserIdentifier" placeholder="Username..." class="w-72"/>

<p class="mt-2">Your password:</p>
<PasswordBox v-model="refPassword" placeholder="Password..." class="w-72" />

<p class="mt-2">
<Button
	ref="refButton"
	:useTurnstile="true"
	labeling="Signing in..."
	:click="onSignIn"
	:state="computedValid ? 'ready' : 'ghost'"
>Sign In</Button>
</p>

<p v-if="refOutput">{{ refOutput }}</p>

</div>
</template>
