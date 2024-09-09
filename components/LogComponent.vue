<script setup>

import { ref, reactive, watch } from 'vue'
import { log, look, Now } from '@/library/library0.js'
import { Tag } from '@/library/library1.js'
import { senseEnvironment } from '@/library/ping.js'

const inputText = ref('')
const environmentText = ref('')


async function clickedEnter() {
	let message = inputText.value
	await logToServer(message)
}
async function logToServer(message) {
	let r = await $fetch('/api/log', {method: 'POST', body: {message}})
	console.log(r)
}



let s = senseEnvironment()
if (process.server) s += ', PDS'
if (process.client) s += ', PDC'
s += ', v2024sep8d'
console.log(s)
await logToServer(s)
environmentText.value = s


</script>
<template>

<form @submit.prevent="clickedEnter">
	<input v-model="inputText" type="text" placeholder="Enter text" />
	<button type="submit">Enter</button>
	<p>{{ environmentText }}</p>
</form>

</template>
<style scoped>

input {
	padding: 5px;
	margin-right: 5px;
}
button {
	padding: 5px 10px;
}

</style>
