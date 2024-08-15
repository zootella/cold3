<template>
	<div>
		<input v-model="inputText" type="text" placeholder="Enter some text" />
		<button @click="handleSubmit">Submit</button>
	</div>
</template>

<script setup>
import { ref } from 'vue'
import { $fetch } from '#app'

const inputText = ref('')

async function handleSubmit() {

	try {
		const response = await $fetch('/api/account', {
			method: 'POST',
			body: {
				text: inputText.value
			}
		})
		console.log('API response:', response)
	} catch (error) {
		console.error('Request failed:', error)
	}
}
</script>
