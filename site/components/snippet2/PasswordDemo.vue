<script setup>

import {
hashText, Data, sayTick,
hashPassword, hashPasswordMeasureSpeed,//ttd december, legacy
passwordStrength, passwordCycles, passwordHash,
} from 'icarus'

const refInput = ref('')
const refOutput = ref('')

function onInput() {
	refOutput.value = passwordStrength(refInput.value)
}

async function onEnter() {
	if (!hasText(refInput.value)) refInput.value = 'hello'
	let passwordText = refInput.value

	//as a possible alternative beyond that, trying out detecting how many cycles we should require
	let cycles = await passwordCycles()

	//basic first method with a uniform number of cycles
	let t = Now()
	let b32 = await passwordHash({passwordText, cycles, saltData: Data({base62: Key('password, salt, public')})})
	let duration = Now() - t

	refOutput.value = `${b32} hashed from ${commas(cycles * 100_000)} cycles in ${duration}ms on ${sayTick(t)}.`
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
