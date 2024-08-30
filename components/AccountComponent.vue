<script setup>

import { ref, reactive, onMounted } from 'vue'
import { log, inspect, Now, sayTick, newline, deindent, Data } from '../library/library0.js'
import { Tag } from '../library/library1.js'
import { getBrowserTag } from '../library/library2.js'

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
	try {
		let response = await $fetch('/api/snippet', {
			method: 'POST',
			body: {
				browserTag: getBrowserTag(),
				now: Now(),
				tag: Tag()
			}
		})
		log('success', inspect(response))
		return response
	} catch (e) {
		log('caught', e)
	}
}

let passwordModel = ref('')
let statusText = ref('(no status yet)')
let stickText = ref('')
function stick(s) { stickText.value += s + newline + newline }

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
