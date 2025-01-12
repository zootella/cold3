<script setup>

import {
log, look, Now, Tag,
getBrowserTag,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'

/*
ok so imagine you just use defineExpose all the time
SignComponent on mounted gets the browser tag, and fetches to find out if we're signed in
same pattern of, if in flight of that request, a call from above also wants to know, the second waits for the first
and cache the sign status--if you ask again it doesn't fetch again

export functions are:
await signIn(password) - true signed in now or false bad password
await signOut()
await signStatus() - true or false we're signed in
and they throw on other problems, considered exceptional

but then the question is likely going to be--does this need to be a component?
could it be a function in level2 that you only call onMounted, instead?
this was what happened with getBrowserTag when you tried to make it a component

the component might be useful to hold the state
and really shows that this code is only for a page running with the user


*/

let browserTag
onMounted(() => {//doesn't run on server, even when hydrating
	browserTag = getBrowserTag()
	signCheck()//async but not awaiting
})

async function signCheck() {
	let response = signFetch({action: 'SignCheck.'})
}
async function signOut() {
	let response = signFetch({action: 'SignOut.'})
}
async function signIn(password) {
	let response = signFetch({action: 'SignIn.', password})
}

async function signFetch(body) {
	body.browserTag = browserTag
	let response = await $fetch('/api/account2', {method: 'POST', body})
	//totally fine to let exceptions go all the way up to the component that called us, remember (but check to see what this is like!)
	return response
}


	let response = await $fetch('/api/account2', {
		method: 'POST',
		body: {browserTag, password: passwordModel.value, action: "SignIn."}
	})

	let response = await $fetch('/api/account2', {
		method: 'POST',
		body: {browserTag, action: "SignOut."}
	})

	let response = await $fetch('/api/account2', {
		method: 'POST',
		body: {browserTag, action: "SignCheck."}
	})



async function signIn(password)    { await callAccount('action in')    }//these should be "In." "Out." "Check."
async function signOut()   { await callAccount('action out')   }
async function signCheck() { await callAccount('action check') }
async function callAccount(action) {
	try {
		let t = Now()
		let response = await $fetch('/api/account2', {
			method: 'POST',
			body: {
				browserTag,
				password: passwordModel.value,
				action,
			}
		})
		t = Now() - t
		log('success', look(response))
		statusText.value = `This browser is ${response.signedIn2 ? 'signed in. 🟢' : 'signed out. ❌'} Fetch: ${t}ms. Note: ${response.note}`
		return response
	} catch (e) {
		log('caught', e)
	}
}

let passwordModel = ref('')
let statusText = ref('(no status yet)')
let stickText = ref('')

</script>
<template>
<div>

sign-in component to try refactoring from account component and message component

</div>
</template>











