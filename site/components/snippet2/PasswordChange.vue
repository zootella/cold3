<script setup>

import {
hashText, hashPassword, hashPasswordMeasureSpeed, Data, sayTick,
} from 'icarus'

const saltData = Data({base32: Key('password, salt, public, page')})
const minimumCycles = textToInt(Key('password, iterations, public, page'))
const targetDuration = textToInt(Key('password, duration, public, page'))

const refPasswordBox = ref('')
const refRepeatBox = ref('')
const refStatus = ref('')

// Called when the submit button is clicked
async function onEnter() {

	if (!hasText(refPasswordBox.value)) { refStatus.value = 'Type a password'; return }
	if (refPasswordBox.value != refRepeatBox.value) { refStatus.value = 'Password boxes must match'; return }
	let passwordText = refPasswordBox.value
	//here is where the button should go orange, and keep orange right through turnstile and actual fetch

	let cycles = await hashPasswordMeasureSpeed(saltData, passwordText, minimumCycles, targetDuration)
	let hash = await hashPassword(cycles, saltData, passwordText)

	let response = await fetchWorker('/api/password', {body: {action: 'Set.', hash: hash.base32(), cycles}})
	log('response from password set', look(response))
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>PasswordChange</i></p>

<p><input type="password" v-model="refPasswordBox" class="w-64" /></p>
<p><input type="password" v-model="refRepeatBox"   class="w-64" /></p>
<p><Button @click="onEnter">Change Password</Button></p>
<p>{{refStatus}}</p>

</div>
</template>
