<script setup>

import {
log, look, Now, sayTick, newline, Data, Tag,
getBrowserTag,
validateEmail, validatePhone,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'

let browserTag
onMounted(async () => {//doesn't run on server, even when hydrating
	browserTag = getBrowserTag()
	stick(`${browserTag} is this browser's tag`)
	await signGet()
})

async function signIn()  { await callAccount('SignIn.')  }
async function signOut() { await callAccount('SignOut.') }
async function signGet() { await callAccount('SignGet.') }
async function callAccount(action) {
	try {
		let t = Now()
		let response = await $fetch('/api/account', {
			method: 'POST',
			body: {browserTag, password: passwordModel.value, action}
		})
		t = Now() - t
		log('success', look(response))
		stick(look(response))
		statusText.value = `This browser is ${response.signedIn2 ? 'signed in. 🟢' : 'signed out. ❌'} Fetch: ${t}ms. Note: ${response.note}`
		return response
	} catch (e) {
		log('caught', e)
	}
}

async function snippet() {
	log('hi from snippet')
	try {
		let response = await $fetch('/api/snippet', {
			method: 'POST',
			body: {browserTag, now: Now(), tag: Tag()}
		})
		log('success', look(response))
		return response
	} catch (e) {
		log('caught', e)
	}
}

let passwordModel = ref('')
let statusText = ref('(no status yet)')
let stickText = ref('')
function stick(s) { stickText.value += s + newline + newline }

</script>
<template>

<div>
	<input v-model="passwordModel" type="text" placeholder="password" />{{' '}}
	<button class="pushy" @click="signIn">Sign In</button>{{' '}}
	<button class="pushy" @click="signOut">Sign Out</button>{{' '}}
	<button class="pushy" @click="signGet">Sign Check</button>{{' '}}
	<button class="pushy" @click="snippet">Snippet</button>{{' '}}
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











