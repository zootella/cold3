<script setup>

import {
log, look, Now, sayTick, newline, Data, Tag,
getBrowserTag
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
		statusText.value = `This browser is ${response.signedIn2 ? 'signed in. 🟢' : 'signed out. ❌'} Fetch: ${t}ms. Note: ${response.note}`
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
let statusText = ref('(no status yet)')
let stickText = ref('')
function stick(s) { stickText.value += s + newline + newline }

let addressModel = ref('')
let messageModel = ref('')
let providerModel = ref('')
let statusText2 = ref('(status text 2)')

async function sendMessage() {
	log('hi from send message')
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
	<input v-model="passwordModel" type="text" placeholder="password" />{{' '}}
	<button @click="signIn">Sign In</button>
	<button @click="signOut">Sign Out</button>
	<button @click="signCheck">Sign Check</button>{{' '}}
	<button @click="runSnippet">Snippet</button>
</div>
<div>
	<p><i>{{ statusText }}</i></p>
</div>

<div>
	<p><input v-model="addressModel" type="text" placeholder="email, phone, or user name" /> <i>{{ statusText2 }}</i></p>
	<p><input v-model="messageModel" type="text" placeholder="message" />
	<input type="radio" id="amazon" value="Amazon" v-model="providerModel" /><label for="amazon">Amazon</label>
	<input type="radio" id="twilio" value="Twilio" v-model="providerModel" /><label for="twilio">Twilio</label>{{' '}}
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
