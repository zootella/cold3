<script setup>

import {
hashText, hashPassword, passwordCycles, Data, sayTick,
} from 'icarus'

const saltData = Data({base62: Key('password, salt, public')})
const minimumCycles = textToInt(Key('password, iterations, public'))
const targetDuration = textToInt(Key('password, duration, public'))

const refInput = ref('')
const refOutput = ref('')

function onInput() {
	refOutput.value = `${refInput.value.length} charcters`
}

async function onEnter() {
	if (!hasText(refInput.value)) refInput.value = 'hello'
	let passwordText = refInput.value

	//basic first method with a uniform number of cycles
	let t = Now()
	let h = await hashPassword(minimumCycles, saltData, passwordText)
	let duration = Now() - t

	//as a possible alternative beyond that, trying out detecting how many cycles we should require
	let targetCycles = await passwordCycles(targetDuration)
	/*
	when you get back in here soon, do change it around a little
	do 3x 100k cycles in a row with a random hash value, and then pick the fastest of those three
	and then for choosing and recording the number, have it in units of 100k cycles
	OWASP recommends 100-500 cycles, so allow a minimum of 100 (recorded as 1) and then on a fast computer there will be a million (recorded as 10)
	*/

	refOutput.value = `${h.base32()} hashed from ${commas(minimumCycles)} cycles in ${duration}ms on ${sayTick(t)}. Recommended cycles here ${commas(targetCycles)}.`
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>PasswordDemo</i></p>

<input type="text" v-model="refInput" @input="onInput" placeholder="Type something..." @keyup.enter="onEnter" />{{' '}}
<Button @click="onEnter">Submit</Button><!-- change this to TriButton obviously, and show orange doing while the page is hashing -->
<p>{{refOutput}}</p>

</div>
</template>
