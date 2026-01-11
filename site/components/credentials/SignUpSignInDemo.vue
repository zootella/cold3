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

//two name boxes: display (top) controls slug (below), but slug is independently editable
const refDisplayBox = ref('')
const refSlugBox = ref('')
const refPassword = ref('')
const refOutput = ref('')

//validated name forms for display
const refStatus = ref(false)
const refName0 = ref('')
const refName1 = ref('')
const refName2 = ref('')

//display box on top controls slug box
watch([refDisplayBox], () => {
	let v = validateName(refDisplayBox.value, Limit.name)
	refStatus.value = v.ok
	if (v.f2ok) {
		refName2.value = v.f2
		refSlugBox.value = v.f1//auto-fill slug from display
	} else {
		refName0.value = ''
		refName1.value = ''
		refName2.value = ''
	}
})
//slug box is also independently editable
watch([refSlugBox], () => {
	let v = validateName(refSlugBox.value, Limit.name)
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
	let vDisplay = validateName(refDisplayBox.value, Limit.name)
	let vSlug = validateName(refSlugBox.value, Limit.name)
	return vDisplay.ok && vSlug.ok
})

const computedPasswordStrength = computed(() => {
	if (!refPassword.value) return ''
	return passwordStrength(refPassword.value)
})

const computedReady = computed(() => {
	return computedValid.value && refPassword.value.length > 0
})

async function onCheckName() {
	let r = await credentialStore.checkName({slug: refSlugBox.value, display: refDisplayBox.value})
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
	let r = await credentialStore.signUpAndSignIn({slug: refSlugBox.value, display: refDisplayBox.value, hash, cycles})

	if (r.outcome == 'SignedUp.') {
		refOutput.value = `Signed up and signed in as ${r.userTag}`
		refDisplayBox.value = ''
		refSlugBox.value = ''
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
<input :maxlength="Limit.name" v-model="refDisplayBox" placeholder="Name for pages..." class="w-72" />
<p v-if="refName2">On pages and cards you'll be <i>{{ refName2 }}</i></p>

<p class="mt-2">Your profile link (you can edit this):</p>
<input :maxlength="Limit.name" v-model="refSlugBox" placeholder="Name for links..." class="w-72" />{{' '}}
<Button
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
	labeling="Signing up..."
	:click="onSignUpAndSignIn"
	:state="computedReady ? 'ready' : 'ghost'"
>Sign Up and Sign In</Button>
</p>

<p v-if="refOutput">{{ refOutput }}</p>

</template>
</div>
</template>
