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
		signInStatus.value = `This browser is ${response.signedIn2 ? 'signed in. 🟢' : 'signed out. ❌'} Fetch: ${t}ms. Note: ${response.note}`
		return response
	} catch (e) {
		log('caught', e)
	}
}

async function runSnippet() {
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
let signInStatus = ref('')
let stickText = ref('')
function stick(s) { stickText.value += s + newline + newline }

let addressModel = ref('')
let messageModel = ref('')
let providerModel = ref('Amazon.')//make amazon default and radio selection always set to something
let addressStatus = ref('')

async function sendMessage() {
	log('hi from send message')

	let message = messageModel.value
	let provider = providerModel.value
	let address = addressModel.value
	let service
	if (validateEmail(address).valid) service = 'Email.'
	if (validatePhone(address).valid) service = 'Phone.'

	try {
		let response = await $fetch('/api/message', {
			method: 'POST',
			body: {browserTag, provider, service, address, message}
		})
		log('api message success', look(response))
		return response
	} catch (e) {
		log('caught', e)
	}
}

function addressKey() {
	let s = addressModel.value
	let emailValidation = validateEmail(s)
	let phoneValidation = validatePhone(s)

	let c = s.length + ' characters'
	if (emailValidation.valid) c += `, valid email "${emailValidation.presented}"`
	if (phoneValidation.valid) c += `, valid phone "${phoneValidation.presented}"`

	addressStatus.value = c
}

</script>
<template>

<div>
	<input type="text" v-model="passwordModel" placeholder="password" />{{' '}}
	<button class="pushy" @click="signIn">Sign In</button>{{' '}}
	<button class="pushy" @click="signOut">Sign Out</button>{{' '}}
	<button class="pushy" @click="signGet">Sign Check</button>{{' '}}
	<button class="pushy" @click="runSnippet">Snippet</button>{{' '}}
</div>
<div>
	<p><i>{{ signInStatus }}</i></p>
</div>

<div>
	<p><input type="text" v-model="addressModel" @input="addressKey" placeholder="email, phone, or user name" /> <i>{{ addressStatus }}</i></p>{{' '}}
	<p><input v-model="messageModel" type="text" placeholder="message" />{{' '}}
	<input type="radio" id="idProviderA" value="Amazon." v-model="providerModel" /><label for="idProviderA">Amazon</label>{{' '}}
	<input type="radio" id="idProviderT" value="Twilio." v-model="providerModel" /><label for="idProviderT">Twilio</label>{{' '}}
	<button class="pushy" @click="sendMessage">Send</button></p>
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
