<script setup>

import { ref, reactive, onMounted } from 'vue'
import { log, inspect, Now, sayTick, newline, deindent, Data } from '../library/library0.js'
import { getBrowserFingerprintAndTag, browserHash } from '../library/library2.js'

onMounted(async () => {//doesn't run on server, even when hydrating
	let t = Now(); browserHashRef.value = await browserHash(); t = Now() - t
	stick(deindent(`
		${browserHashRef.value} hashed in ${t}ms from:
		${getBrowserFingerprintAndTag()}
	`))
	await signCheck()
})

const passwordModel = ref('')
const browserHashRef = ref('')

async function signIn() {
	let response = await callAccount('action in')

}
async function signOut() {
	let response = await callAccount('action out')

}
async function signCheck() {
	let response = await callAccount('action check')

}


async function callAccount(action) {
	try {
		let t = Now()
		let response = await $fetch('/api/account', {
			method: 'POST',
			body: {
				browserHash: browserHashRef.value,
				password: passwordModel.value,
				action
			}
		})
		t = Now() - t
		log('success', inspect(response))
		stick(inspect(response))
		statusText.value = `This browser is ${response.signedIn2 ? 'signed in. 🟢' : 'signed out. ❌'} Fetch: ${t}ms. Note: ${response.note}`
		return response
	} catch (e) {
		log('caught', e)
	}
}

async function snippet() {
	log('hi from snippet')
}


let status = reactive({
	composedText: '(no status yet)'
})

/*
This browser is 🟢 signed in. Fetch: 12ms. Note:  
This browser is 🔴 signed out.


signedIn2
note

*/



let statusText = ref('(no status yet)')
let stickText = ref('')
function stick(s) { stickText.value += s + newline + newline }

</script>
<template>

<div>
	<input v-model="passwordModel" type="text" placeholder="password" />
	<button @click="signIn">Sign In</button>
	<button @click="signOut">Sign Out</button>
	<button @click="signCheck">Sign Check</button>
	<button @click="snippet">Snippet</button>
</div>

<div>
	<p>
		{{ statusText }}
	</p>
</div>

<div>
	<textarea :value="stickText" readOnly></textarea>
</div>

</template>
<style scoped>

textarea {
	width: calc(100% - 2em); /* Adjust the margin size as needed */
	margin-right: 2em; /* Add right margin */
	height: 24em;
	overflow-x: hidden; /* Hide horizontal scrollbar */
	white-space: pre-wrap; /* Wrap lines */
	border: none; /* Remove border */
	background-color: #f8f8f8; /* Very light gray background */
}

</style>
