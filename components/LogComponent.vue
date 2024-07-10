<template>

<form @submit.prevent="logToServer">
	<input v-model="inputText" type="text" placeholder="Enter text" />
	<button type="submit">Enter</button>
</form>

</template>
<script setup>

import { ref, reactive, watch } from 'vue'
import { log, inspect, Now } from '../library/library0.js'

const inputText = ref('')

async function logToServer() {
	let message = inputText.value
	try {
		log('logging to server: '+message)
		let response = await $fetch('/api/log', {
			method: 'POST',
			body: {
				message
			}
		})
	} catch (e) {
	}
}

</script>
<style scoped>

input {
	padding: 5px;
	margin-right: 5px;
}
button {
	padding: 5px 10px;
}

</style>
