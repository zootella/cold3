<script setup>

import {
validateName,
passwordStrength, passwordCycles, passwordHash,
Data,
} from 'icarus'

/*
hi claude, so now we'll leave this demo as-is, but looking at our plan, i think much of this functionality will get copied into the "sign up" flow within CredentialCorner, which is fine
*/

const credentialStore = useCredentialStore()

//button refs for turnstile token access
const refCheckButton = ref(null)
const refSignUpButton = ref(null)

//name validation refs following ValidateNameComponent pattern
const refStatus = ref(false)//overall status
const refName0 = ref('')//output for form 0, normalized to reserve
const refName1 = ref(''); const refBox1 = ref('')//output text and input box for form 1, canonical for route
const refName2 = ref(''); const refBox2 = ref('')//output text and input box for form 2, pretty for pages and cards

const refPassword = ref('')
const refOutput = ref('')

watch([refBox2], () => {//box 2 on top controls box 1
	let v = validateName(refBox2.value, Limit.name)
	refStatus.value = v.ok
	if (v.f2ok) {
		refName2.value = v.f2
		refBox1.value = v.f1
	} else {
		refName0.value = ''
		refName1.value = ''
		refName2.value = ''
	}
})
watch([refBox1], () => {//which is also independently editable
	let v = validateName(refBox1.value, Limit.name)
	refStatus.value = v.ok
	if (v.ok) {
		refName0.value = v.f0
		refName1.value = v.f1
	} else {
		refName0.value = ''
		refName1.value = ''
		refName2.value = ''
	}
})

const computedValid = computed(() => {
	let v1 = validateName(refBox1.value, Limit.name)
	let v2 = validateName(refBox2.value, Limit.name)
	return v1.ok && v2.ok
})

const computedPasswordStrength = computed(() => {
	if (!refPassword.value) return ''
	return passwordStrength(refPassword.value)
})

const computedReady = computed(() => {
	return computedValid.value && refPassword.value.length > 0
})

async function onCheckName() {
	let turnstileToken = await refCheckButton.value.getTurnstileToken()
	let r = await credentialStore.checkName({raw1: refBox1.value, raw2: refBox2.value, turnstileToken})
	if (r.outcome == 'NameAvailable.') {
		refOutput.value = `"${r.v.f2}" is available! Your profile will be at /${r.v.f1}`
	} else if (r.outcome == 'NameNotAvailable.') {
		refOutput.value = 'That name is not available, please choose another.'
	}
}

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
	let r = await credentialStore.signUpAndSignIn({raw1: refBox1.value, raw2: refBox2.value, hash, cycles, turnstileToken})

	if (r.outcome == 'SignedUp.') {
		refOutput.value = `Signed up and signed in as ${r.userTag}`
		refBox1.value = ''
		refBox2.value = ''
		refPassword.value = ''
		refName0.value = ''
		refName1.value = ''
		refName2.value = ''
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

<p>Choose your display name:</p>
<input :maxlength="Limit.name" v-model="refBox2" placeholder="Name for pages..." class="w-72" />
<p v-if="refName2">On pages and cards you'll be <i>{{ refName2 }}</i></p>

<p class="mt-2">Your profile link (you can edit this):</p>
<input :maxlength="Limit.name" v-model="refBox1" placeholder="Name for links..." class="w-72" />{{' '}}
<Button
	ref="refCheckButton"
	:useTurnstile="true"
	labeling="Checking..."
	:click="onCheckName"
	:state="computedValid ? 'ready' : 'ghost'"
>Check if Available</Button>
<p v-if="refName1">Your profile will be at <code>https://{{Key('domain, public')}}/{{ refName1 }}</code></p>
<p v-if="refName0">We'll reserve <code>{{ refName0 }}</code> for you, also.</p>

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
