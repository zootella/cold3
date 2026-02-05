<script setup>
/*
SetPasswordForm.vue - password entry with confirmation and client-side hashing

Shows: current password (if cycles > 0), new password + confirm (with eye sync), strength indicator, match warning
Modes: cycles=0 for new password, cycles>0 for changing existing; hideButton=true lets parent control submission
Props: cycles (number) - 0 for new, >0 for change; hideButton (boolean) - hide internal button
Exposes: valid (computed), hash() (async method returning {newHash, newCycles, currentHash?})
Parent usage:
  - With own button: <SetPasswordForm ref="ref" :cycles="0" :hideButton="true" />, then ref.hash() on submit
  - Self-contained: <SetPasswordForm :cycles="n" @done="handler" />, emits done with hash result
Server contact: none; purely client-side hashing using passwordCycles() and passwordHash()
Nested: uses PasswordBox with v-model:eye for synchronized show/hide between new and confirm fields
*/

import {
passwordStrength, passwordCycles, passwordHash,
Data,
} from 'icarus'

const props = defineProps({
	cycles: {type: Number, default: 0},//0 means setting new password, >0 means changing existing password
	hideButton: {type: Boolean, default: false},//true when parent provides its own button and calls hash() directly
})
const emit = defineEmits(['done'])

const refCurrentPassword = ref('')
const refNewPassword = ref('')
const refConfirmPassword = ref('')
const refEye = ref(false)//synchronized show/hide for new password pair
const refOutput = ref('')

const computedStrength = computed(() => {
	if (!refNewPassword.value) return ''
	return passwordStrength(refNewPassword.value)
})

const computedMatch = computed(() => {
	if (!refNewPassword.value || !refConfirmPassword.value) return true//don't show mismatch until both have content
	return refNewPassword.value === refConfirmPassword.value
})

const computedValid = computed(() => {
	if (props.cycles > 0 && !refCurrentPassword.value) return false//need current password
	if (!refNewPassword.value) return false
	if (!refConfirmPassword.value) return false
	if (refNewPassword.value !== refConfirmPassword.value) return false
	return true
})

async function hash() {//returns {newHash, newCycles, currentHash?} - called internally by onEnter or externally by parent
	refOutput.value = 'Measuring speed...'
	let newCycles = await passwordCycles()

	refOutput.value = 'Hashing password...'
	let result = {newCycles}

	//hash current password if changing existing
	if (props.cycles > 0) {
		result.currentHash = await passwordHash({
			passwordText: refCurrentPassword.value,
			cycles: props.cycles,
			saltData: Data({base62: Key('password, salt, public')}),
		})
	}

	//hash new password
	result.newHash = await passwordHash({
		passwordText: refNewPassword.value,
		cycles: newCycles,
		saltData: Data({base62: Key('password, salt, public')}),
	})

	refOutput.value = ''
	return result
}

async function onEnter() {
	if (!computedValid.value) return
	let result = await hash()
	emit('done', result)
}

defineExpose({
	valid: computedValid,
	hash,
})

</script>
<template>
<div>

<template v-if="props.cycles > 0">
	<p>Current password:</p>
	<PasswordBox v-model="refCurrentPassword" placeholder="Current password..." class="w-72" />
</template>

<p class="mt-2">New password:</p>
<PasswordBox v-model="refNewPassword" v-model:eye="refEye" placeholder="New password..." class="w-72" />
<span v-if="refNewPassword"> {{ computedStrength }}</span>

<p class="mt-2">Confirm new password:</p>
<PasswordBox v-model="refConfirmPassword" v-model:eye="refEye" placeholder="Confirm password..." class="w-72" />
<span v-if="!computedMatch" class="text-red-600"> Passwords do not match</span>

<p v-if="!props.hideButton" class="mt-2 flex flex-wrap items-baseline gap-2">
	<Button
		:click="onEnter"
		:state="computedValid ? 'ready' : 'ghost'"
		labeling="Working..."
	>{{ props.cycles > 0 ? 'Change Password' : 'Set Password' }}</Button>
	<slot name="actions"></slot>
	<span v-if="refOutput">{{ refOutput }}</span>
</p>
<p v-else-if="refOutput" class="mt-2">{{ refOutput }}</p>

</div>
</template>
