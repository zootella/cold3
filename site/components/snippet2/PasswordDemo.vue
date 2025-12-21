<script setup>

import {
hashText, Data, sayTick,
passwordStrength, passwordCycles, passwordHash,
} from 'icarus'

const refInput = ref('')
const refOutput = ref('')
const refDoing = ref(false)//true while hashing is in flight, from either enter key in box or button click

function onInput() {
	refOutput.value = `Password strength: ${passwordStrength(refInput.value)}`
}

async function onEnter() {
	if (refDoing.value) return//already in flight
	if (!hasText(refInput.value)) return//nothing to hash
	refDoing.value = true
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
	refDoing.value = false
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>PasswordDemo</i></p>

<PasswordBox v-model="refInput" @input="onInput" @enter="onEnter" placeholder="Password..." class="w-72" />{{' '}}
<Button labeling="Hashing..." :click="onEnter" :model-value="refDoing ? 'doing' : (refInput ? 'ready' : 'ghost')">Enter</Button>
<p>{{refOutput}}</p>

</div>
</template>
