<script setup>

import {
log, look, Now, sayTick, newline, Data, Tag, hasText,
getBrowserTag, isLocal, validateName,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'

const refState = ref(0)//to begin, determining what our browser tag and user tag are
const refBrowserTag = ref('')//the browser here's tag, read from local storage
const refUserTag = ref('')//the user tag of the user who is signed in to this browser right now
const refUserName = ref('')//the user name of that tag, signed in, according to the server
const refDesiredUserNameBox = ref('')
const refReturningUserNameBox = ref('')
const refMessage = ref('')//status and response message back to the user

onMounted(async () => {//doesn't run on server, even when hydrating
	refBrowserTag.value = getBrowserTag()//read browser tag from local storage
	//ttd march, should this instead come from the hello store?
	await doSignGet()
})

async function doSignGet() {
	let r = await $fetch('/api/authenticate', {method: 'POST', body:
		{action: 'DemonstrationSignGet.', browserTag: refBrowserTag.value}})
	if (r.isFound) {//server tells us we've got a user signed into this browser here
		refState.value = 4
		refUserTag.value = r.userTag
		refUserName.value = r.nameNormal
	} else {//server tells us, no user is signed in here based on our browser tag
		refState.value = 1
	}
}
async function clickedSignUp() {
	let v = validateName(refDesiredUserNameBox.value)
	if (v.isValid) {
		let r = await $fetch('/api/authenticate', {method: 'POST', body:
			{action: 'DemonstrationSignUp.', browserTag: refBrowserTag.value, nameNormal: v.formNormal}})
		if (r.isSignedUp) {
			await doSignGet()//ttd march, this shouldn't be another round trip
		} else {
			refMessage.value = r.reason//probably NameTaken.
		}
	} else {
		refMessage.value = 'Name not valid'
	}
}

async function clickedSignIn() {
	let v = validateName(refReturningUserNameBox.value)
	if (v.isValid) {
		let r = await $fetch('/api/authenticate', {method: 'POST', body:
			{action: 'DemonstrationSignIn.', browserTag: refBrowserTag.value, nameNormal: v.formNormal}})
		if (r.isSignedIn) {
			await doSignGet()//ttd march, this shouldn't be another round trip
		} else {
			refMessage.value = r.reason
		}
	} else {
		refMessage.value = 'Name not valid'
	}
}

async function clickedSignOut() {
	let r = await $fetch('/api/authenticate', {method: 'POST', body:
		{action: 'DemonstrationSignOut.', browserTag: refBrowserTag.value}})
	if (r.isSignedOut) {
		await doSignGet()//ttd march, should not need another round trip
	} else {
		refMessage.value = r.reason
	}
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>AuthenticateComponent</i></p>

<p><code>{{refBrowserTag}}</code> browser tag</p>

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

<div>
	<p>{{refMessage}}</p>
</div>

</div>
</template>
<style scoped>
</style>
