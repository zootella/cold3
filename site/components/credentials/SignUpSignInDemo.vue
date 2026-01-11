<script setup>
/*
hi claude, our current work involves this component: SignUpSignInDemo
it's recent and we worked on it together
as we've gotten name choosing functionality and safety into ChooseNameFormlet, things here are shorter and simpler
eventually, we'll deprecate and delete this component, but it was absolutely necessary to complete smoke tests that create a user with starting credentials, testing code flows full stack as we code this one small testable step at a time!
*/

import {
passwordStrength, passwordCycles, passwordHash,
Data,
} from 'icarus'

const credentialStore = useCredentialStore()

//formlet ref to access name fields
const refChooseName = ref(null)

//button ref for turnstile token access
const refSignUpButton = ref(null)

const refPassword = ref('')
const refOutput = ref('')

const computedPasswordStrength = computed(() => {
	if (!refPassword.value) return ''
	return passwordStrength(refPassword.value)
})

const computedReady = computed(() => {
	return refChooseName.value?.valid && refPassword.value.length > 0
})

async function onSignUpAndSignIn() {
	refOutput.value = 'Hashing password...'

	//hash password with measured cycles
	let cycles = await passwordCycles()
	let hash = await passwordHash({
		passwordText: refPassword.value,
		cycles,
		saltData: Data({base62: Key('password, salt, public')}),
	})

	refOutput.value = 'Signing up...'

	//call API to create user
	let turnstileToken = await refSignUpButton.value.getTurnstileToken()
	let r = await credentialStore.signUpAndSignIn({raw1: refChooseName.value.raw1, raw2: refChooseName.value.raw2, hash, cycles, turnstileToken})

	if (r.outcome == 'SignedUp.') {
		refOutput.value = `Signed up and signed in as ${r.userTag}`
		refChooseName.value.clear()
		refPassword.value = ''
	} else if (r.outcome == 'NameNotAvailable.') {
		refOutput.value = 'That name is not available, please choose another.'
	} else {
		refOutput.value = `Error: ${r.outcome}`
	}
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>SignUpSignInDemo</i></p>

<template v-if="credentialStore.userTag">
<p>Existing user already signed in.</p>
</template>
<template v-else>

<ChooseNameFormlet ref="refChooseName" />

<p class="mt-2">Choose your password:</p>
<PasswordBox v-model="refPassword" placeholder="Password..." class="w-72" />
<span v-if="refPassword"> {{ computedPasswordStrength }}</span>

<p class="mt-2">
<Button
	ref="refSignUpButton"
	:useTurnstile="true"
	labeling="Signing up..."
	:click="onSignUpAndSignIn"
	:state="computedReady ? 'ready' : 'ghost'"
>Sign Up and Sign In</Button>
</p>

<p v-if="refOutput">{{ refOutput }}</p>

</template>
</div>
</template>
