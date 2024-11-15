<script setup>

import {
log, look, Now, sayTick, newline, Data, Tag,
getBrowserTag,
validateEmail, validatePhone,
} from 'icarus'

import { ref, reactive, onMounted } from 'vue'

onMounted(async () => {//doesn't run on server, even when hydrating
	stick(`${getBrowserTag()} is this browser's tag`)
	await signCheck()
})

async function signIn()    { await callAccount('action in')    }
async function signOut()   { await callAccount('action out')   }
async function signCheck() { await callAccount('action check') }
async function callAccount(action) {
	try {
		let t = Now()
		let response = await $fetch('/api/account', {
			method: 'POST',
			body: {
				browserTag: getBrowserTag(),
				password: passwordModel.value,
				action
			}
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
			body: {
				browserTag: getBrowserTag(),
				now: Now(),
				tag: Tag()
			}
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
			body: {
				provider, service, address, message,
			}
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

/*
bookmark
to this, you want to add
if you're signed in, messaging controls appear below
()amazon ()twilio
to[]
message[]
[send]
you can type an email or phone number into to
and a short single line note
it outputs the timestamp it put on it, like
amazon calls cold3<>net23, also
*/

</script>
<template>

<div>
	<input type="text" v-model="passwordModel" placeholder="password" />{{' '}}
	<button @click="signIn">Sign In</button>
	<button @click="signOut">Sign Out</button>
	<button @click="signCheck">Sign Check</button>{{' '}}
	<button @click="runSnippet">Snippet</button>
</div>
<div>
	<p><i>{{ signInStatus }}</i></p>
</div>

<div>


	<p><input type="text" v-model="addressModel" @input="addressKey" placeholder="email, phone, or user name" /> <i>{{ addressStatus }}</i></p>
	<p><input v-model="messageModel" type="text" placeholder="message" />
	<input type="radio" id="idProviderA" value="Amazon." v-model="providerModel" /><label for="idProviderA">Amazon</label>
	<input type="radio" id="idProviderT" value="Twilio." v-model="providerModel" /><label for="idProviderT">Twilio</label>{{' '}}
	<button @click="sendMessage">Send</button></p>
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
