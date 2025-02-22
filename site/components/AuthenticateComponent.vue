<script setup>

import {
log, look, Now, sayTick, newline, Data, Tag, hasText,
getBrowserTag, isLocal,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'

let refState = ref(0)//to begin, determining what our browser tag and user tag are
let refBrowserTag = ref('')//the browser here's tag, read from local storage
let refUserTag = ref('')//the user tag of the user who is signed in to this browser right now
let refUserName = ref('')//the user name of that tag, signed in, according to the server
let refDesiredUserNameBox = ref('')
let refReturningUserNameBox = ref('')

onMounted(async () => {//doesn't run on server, even when hydrating
	refBrowserTag.value = getBrowserTag()//read browser tag from local storage
	await doSignGet()
})

async function doSignGet() {
	let r = await $fetch('/api/authenticate', {method: 'POST', body:
		{action: 'DemonstrationSignGet.', browserTag: refBrowserTag.value}})
	if (r.result?.isFound) {//server tells us we've got a user signed into this browser here
		refState.value = 4
		refUserTag.value = r.result.userTag
		refUserName.value = r.result.nameNormal
	} else {//server tells us, no user is signed in here based on our browser tag
		refState.value = 1
	}
}
async function clickedSignUp() {
	let r = await $fetch('/api/authenticate', {method: 'POST', body:
		{action: 'DemonstrationSignUp.', browserTag: refBrowserTag.value, nameRaw: refDesiredUserNameBox.value}})
	log(look(r))
	await doSignGet()
}

async function clickedSignIn() {
	let r = await $fetch('/api/authenticate', {method: 'POST', body:
		{action: 'DemonstrationSignIn.', browserTag: refBrowserTag.value, nameRaw: refReturningUserNameBox.value}})
	log(look(r))
	await doSignGet()
}
async function clickedSignOut() {
	let r = await $fetch('/api/authenticate', {method: 'POST', body:
		{action: 'DemonstrationSignOut.', browserTag: refBrowserTag.value}})
	log(look(r))
	await doSignGet()
}


//ttd february, just add something so the []button only is clickable when not in flight, and when v.isValid is true
//and show []text below the box that says "not valid for a username" or "validated to blah-1" showing the normalized form

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>AuthenticateComponent</i></p>

<p><code>{{ refBrowserTag }}</code> browser tag</p>

<!-- state 0: determining if there is a user signed in; show no controls yet -->

<!-- state 1: confirmed no user is signed in -->
<div v-show="refState == 1">
	<button @click="refState = 2" class="pushy">Sign Up</button>{{' '}}
	<button @click="refState = 3" class="pushy">Sign In</button>
</div>

<!-- state 2: clicked into "Sign Up" view -->
<div v-show="refState == 2">
	<p><button @click="refState = 1" class="linky">{{'<'}} Back</button></p>
	<p>Hello new person! To sign up, choose a new user name for yourself:</p>
	<p>
		<input type="text" v-model="refDesiredUserNameBox" placeholder="desired user name" />{{' '}}
		<button @click="clickedSignUp()" class="pushy">Sign Up</button>
	</p>
</div>

<!-- state 3: clicked into "Sign In" view -->
<div v-show="refState == 3">
	<p><button @click="refState = 1" class="linky">{{'<'}} Back</button></p>
	<p>Welcome back! Sign in with your existing user name:</p>
	<p>
		<input type="text" v-model="refReturningUserNameBox" placeholder="returning user name" />{{' '}}
		<button @click="clickedSignIn()" class="pushy">Sign In</button>
	</p>
</div>

<!-- state 4: user is signed in -->
<div v-show="refState == 4">
	<p><code>{{ refUserTag }}</code> user tag of <code>{{ refUserName }}</code> signed in</p>
	<p><button @click="clickedSignOut()" class="pushy">Sign Out</button></p>
</div>

</div>
</template>
<style scoped>
</style>
