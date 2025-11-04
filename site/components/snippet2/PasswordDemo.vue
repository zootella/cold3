<script setup>

import {
hashPassword, Data, sayTick,
} from 'icarus'

const salt = Data({base32: Key('password hashing, choice 1, salt, public, page')})
const iterations = textToInt(Key('password hashing, choice 1, iterations, public, page'))
//yes, these are factory presets, acceptable and necessary to include in the client bundle for script on the page, ok to reveal pubicly

const refInput = ref('')
const refOutput = ref('')

// Called with every character typed
function onTyping() {
	refOutput.value = `${refInput.value.length} charcters`
}

// Called when the submit button is clicked
async function onEnter() {
	if (!hasText(refInput.value)) refInput.value = 'password12345'
	let password = refInput.value

	let t = Now()
	let h = await hashPassword(iterations, salt, refInput.value)
	let duration = Now() - t

	refOutput.value = `${h.base32()} hashed from ${iterations} thousand iterations in ${duration}ms on ${sayTick(t)}`
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
