<script setup>

import {
hashText, hashPassword, hashPasswordMeasureSpeed, Data, sayTick, sayGroupDigits,
} from 'icarus'

const saltData = Data({base32: Key('password hashing, choice 1, salt, public, page')})
const minimumCycles = textToInt(Key('password hashing, choice 1, iterations, public, page'))
const targetDuration = 420//a little less than half a second
//ttd november, maybe move either cycles here, or duration to key, not sure
//yes, these are factory presets, acceptable and necessary to include in the client bundle for script on the page, ok to reveal pubicly

const refInput = ref('')
const refOutput = ref('')

// Called with every character typed
function onTyping() {
	refOutput.value = `${refInput.value.length} charcters`
}

// Called when the submit button is clicked
async function onEnter() {
	if (!hasText(refInput.value)) refInput.value = 'hello'
	let passwordText = refInput.value

	//basic first method with a uniform number of cycles
	let t = Now()
	let h = await hashPassword(minimumCycles, saltData, passwordText)
	let duration = Now() - t

	//as a possible alternative beyond that, trying out detecting how many cycles we should require
	let targetCycles = await hashPasswordMeasureSpeed(saltData, passwordText, minimumCycles, targetDuration)

	refOutput.value = `${h.base32()} hashed from ${sayGroupDigits(minimumCycles+'')} cycles in ${duration}ms on ${sayTick(t)}. To spend ${targetDuration}ms, target ${sayGroupDigits(targetCycles+'')} cycles.`
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>PasswordDemo</i></p>

<input type="text" v-model="refInput" @input="onTyping" placeholder="Type something..." @keyup.enter="onEnter" />{{' '}}
<Button @click="onEnter">Submit</Button>
<p>{{refOutput}}</p>

</div>
</template>
