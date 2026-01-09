<script setup>

import {
hashText, Data, sayTick,
passwordStrength, passwordCycles, passwordHash,
} from 'icarus'

const refInput = ref('')
const refOutput = ref('')
const refButton = ref(null)

function onInput() {
	refOutput.value = `Password strength: ${passwordStrength(refInput.value)}`
}

async function onEnter() {
	//as a possible alternative beyond that, trying out detecting how many cycles we should require
	let cycles = await passwordCycles()

	//basic first method with a uniform number of cycles
	let t = Now()
	let b32 = await passwordHash({
		passwordText: refInput.value,
		cycles,
		saltData: Data({base62: Key('password, salt, public')}),
	})
	let duration = Now() - t

	refOutput.value = `${b32} hashed from ${commas(cycles * 100_000)} cycles in ${duration}ms on ${sayTick(t)}.`
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>PasswordDemo</i></p>

<PasswordBox v-model="refInput" @input="onInput" @enter="refButton.click()" placeholder="Password..." class="w-72" />{{' '}}
<Button
	labeling="Hashing..."
	:click="onEnter"
	:state="refInput ? 'ready' : 'ghost'" ref="refButton"
>Enter</Button>
<p>{{refOutput}}</p>

</div>
</template>
