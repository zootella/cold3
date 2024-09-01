<script setup>

import { ref, reactive, watch, onMounted } from 'vue'

const passwordMessage = ref('')
const emailMessage = ref('')
const phoneMessage = ref('')

const passwordBox = ref('')
const emailBox = ref('')
const phoneBox = ref('')
const logBox = ref('')

watch(passwordBox, (s) => {
	passwordMessage.value = `entered ${s.length} password characters`
})
watch(emailBox, (s) => {
	emailMessage.value = `entered ${s.length} email characters`
	//todo, does it look like a valid email address
})
watch(phoneBox, (s) => {
	phoneMessage.value = `entered ${s.length} phone characters`
	//todo does it look like a valid phone number
})



async function clickEmail() {
	log(`clicked email, fetch sending password ${passwordBox.value} and email ${emailBox.value}`)
	try {
		//v just noticed that this is fetch, not useFetch, nor $fetch?!
		let response = await fetch('/api/send_email', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password: passwordBox.value, email: emailBox.value })
		});
		if (!response.ok) {
			log('response not ok')
		}
		let result = await response.json()
		log('fetch result:', look(result))
	} catch (e) {
		log('fetch error:', look(e))
	}
}
async function clickPhone() {
	log(`clicked phone, fetch sending password ${passwordBox.value} and phone ${phoneBox.value}`)

}

/*
you haven't actually submitted anything in a fetch yet
wire it up so it just says what you entered, and if your password was correct or not
*/

</script>
<template>
<div>

<p>
	Password
	<input type="text" v-model="passwordBox" />
	{{ passwordMessage }}
</p>
<p>
	Email
	<input type="text" v-model="emailBox" />{{' '}}
	<button @click="clickEmail">Send Email</button>
	{{ emailMessage }}
</p>
<p>
	Phone
	<input type="text" v-model="phoneBox" />{{' '}}
	<button @click="clickPhone">Send Text</button>
	{{ phoneMessage }}
</p>

<p><textarea readOnly :value="logBox"></textarea></p>

</div>
</template>
<style scoped>

textarea {

	width: calc(100% - 2em); /* Adjust the margin size as needed */
	margin-right: 2em; /* Add right margin */

	max-width: 100%;
	height: 20em; /* Adjust to control the number of lines */
	resize: vertical; /* Allows vertical resizing */
	overflow-x: hidden; /* Hide horizontal scrollbar */
	white-space: pre-wrap; /* Wrap lines */
}

</style>
