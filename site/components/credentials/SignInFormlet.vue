<script setup>

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
	let cyclesTask = await credentialStore.getCycles({userIdentifier: refUserIdentifier.value, turnstileToken})
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
