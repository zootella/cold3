<script setup>

import {
hashText, hashPassword, hashPasswordMeasureSpeed, Data, sayTick, sayGroupDigits,
} from 'icarus'

const saltData = Data({base32: Key('password, salt, public, page')})
const minimumCycles = textToInt(Key('password, iterations, public, page'))
const targetDuration = textToInt(Key('password, duration, public, page'))

const refPasswordBox = ref('')
const refStatus = ref('')

let cycles

onMounted(async () => {
	let response = await fetchWorker('/api/password', {body: {action: 'Status.'}})
	log('in PasswordChallenge, response from on mounted status', look(response))
	if (response.outcome == 'StatusPasswordProtected.') {
		cycles = response.cycles
	} else if (response.outcome == 'StatusNoPassword.') {
	}


})

async function onEnter() {
	let passwordText = refPasswordBox.value
	//gray box if no text so you don't have to check here

	let hash = await hashPassword(cycles, saltData, passwordText)

	let response = await fetchWorker('/api/password', {body: {action: 'Validate.', hash: hash.base32()}})
	log('in PasswordChallenge, response from on enter validate', look(response))
	if (response.outcome == 'Correct.') {
		refStatus.value = 'password correct'
	} else if (response.outcome == 'Wrong.') {
		refStatus.value = 'wrong, try again'
	}

}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>PasswordChallenge</i></p>

<input type="password" v-model="refPasswordBox" @keyup.enter="onEnter" class="w-64" />{{' '}}
<Button @click="onEnter">Sign In</Button>
<p>{{refStatus}}</p>

</div>
</template>
