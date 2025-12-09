<script setup>

import {
hashText, hashPassword, hashPasswordMeasureSpeed, Data, sayTick,
} from 'icarus'

const saltData = Data({base62: Key('password, salt, public')})
const minimumCycles = textToInt(Key('password, iterations, public'))
const targetDuration = textToInt(Key('password, duration, public'))
const refInput = ref('')
const refOutput = ref('')

function onTyping() {
	refOutput.value = `${refInput.value.length} charcters`
}
async function onEnter() {
	if (!hasText(refInput.value)) refInput.value = 'hello'
	let passwordText = refInput.value

	let t = Now()
	let h = await hashPassword(minimumCycles, saltData, passwordText)
	let duration = Now() - t
	let targetCycles = await hashPasswordMeasureSpeed(saltData, passwordText, minimumCycles, targetDuration)
	refOutput.value = `${h.base32()} hashed from ${commas(minimumCycles)} cycles in ${duration}ms on ${sayTick(t)}. To spend ${targetDuration}ms, target ${commas(targetCycles)} cycles.`
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>PasswordDemo1 (legacy)</i></p>

<input type="text" v-model="refInput" @input="onTyping" placeholder="Type something..." @keyup.enter="onEnter" />{{' '}}
<Button @click="onEnter">Submit</Button>
<p>{{refOutput}}</p>

</div>
</template>
