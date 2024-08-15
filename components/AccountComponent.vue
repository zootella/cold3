<script setup>

import { ref, onMounted } from 'vue'
import { log, inspect, Now, sayTick, newline, deindent, Data } from '../library/library0.js'
import { getBrowserFingerprintAndTag, browserHash } from '../library/library2.js'

onMounted(async () => {
	let t = Now(); let b = await browserHash(); t = Now() - t
	stick(deindent(`
		${b} hashed in ${t}ms from:
		${getBrowserFingerprintAndTag()}
	`))
})

const passwordModel = ref('')
function signIn() {
	stick('clicked sign in')
}
function signOut() {
	stick('clicked sign out')
}


async function snippet() {
	try {
		let response = await $fetch('/api/account', {
			method: 'POST',
			body: {
				password: passwordModel.value
			}
		})
		log('success', inspect(response))
	} catch (e) {
		log('caught', e)
	}
}



let stickText = ref('')
function stick(s) { stickText.value += s + newline }

</script>
<template>

<div>
	<p>this is the account component</p>
</div>

<div>
	<input v-model="passwordModel" type="text" placeholder="password" />
	<button @click="signIn">Sign In</button>
	<button @click="signOut">Sign Out</button>
	<button @click="snippet">Snippet</button>
</div>

<div>
	<textarea :value="stickText" readOnly></textarea>
</div>

</template>
<style scoped>

textarea {
	width: calc(100% - 2em); /* Adjust the margin size as needed */
	margin-right: 2em; /* Add right margin */
	height: 12em;
	overflow-x: hidden; /* Hide horizontal scrollbar */
	white-space: pre-wrap; /* Wrap lines */
	border: none; /* Remove border */
	background-color: #f8f8f8; /* Very light gray background */
}

</style>
