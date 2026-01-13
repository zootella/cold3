<script setup>
/*
SignUpOrSignInForm.vue - parent orchestrator for sign up and sign in flows

Shows: two buttons (Sign Up, Log In) in choose mode; expands to show appropriate formlet
Modes: refMode enum ('choose' | 'signup' | 'signin') with Back link to return to choose
Parent: just render <SignUpOrSignInForm />, no props needed
Server contact: none directly; delegates to SignUpForm or SignInForm
End state: when nested formlet completes sign up/in, credentialStore updates reactively
*/

import {
} from 'icarus'

const refMode = ref('choose')//choose | signup | signin

function onBack() {
	refMode.value = 'choose'
}

</script>
<template>
<div>

<template v-if="refMode === 'choose'">
	<p class="my-space">
		<Button :click="() => refMode = 'signup'">Sign Up</Button>
		<Button :click="() => refMode = 'signin'">Log In</Button>
	</p>
</template>

<template v-else-if="refMode === 'signup'">
	<p><Button link :click="onBack">&lt; Back</Button></p>
	<SignUpForm />
</template>

<template v-else-if="refMode === 'signin'">
	<p><Button link :click="onBack">&lt; Back</Button></p>
	<SignInForm />
</template>

</div>
</template>
<style scoped>

.my-space {
	@apply flex flex-wrap items-baseline gap-2;
}

</style>
