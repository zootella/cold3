<script setup>

import {
validateName,
} from 'icarus'

const refState = ref(0)//to begin, determining what our browser tag and user tag are
const refUserTag = ref('')//the user tag of the user who is signed in to this browser right now
const refUserName = ref('')//the user name of that tag, signed in, according to the server
const refDesiredUserNameBox = ref('')
const refReturningUserNameBox = ref('')
const refMessage = ref('')//status and response message back to the user

onMounted(async () => {//doesn't run on server, even when hydrating
	await doSignGet()
})

async function doSignGet() {
	let r = await fetchWorker('/api/authenticate', {body:
		{action: 'DemonstrationSignGet.'}})
	if (r.isFound) {//server tells us we've got a user signed into this browser here
		refState.value = 4
		refUserTag.value = r.userTag
		refUserName.value = r.name0
	} else {//server tells us, no user is signed in here based on our browser tag
		refState.value = 1
	}
}
async function clickedSignUp() {
	let v = validateName(refDesiredUserNameBox.value)
	if (v.ok) {
		let r = await fetchWorker('/api/authenticate', {body:
			{action: 'DemonstrationSignUp.', name0: v.f0}})
		if (r.isSignedUp) {
			await doSignGet()//ttd march2025, this shouldn't be another round trip
		} else {
			refMessage.value = r.reason//probably NameTaken.
		}
	} else {
		refMessage.value = 'Name not valid'
	}
}

async function clickedSignIn() {
	let v = validateName(refReturningUserNameBox.value)
	if (v.ok) {
		let r = await fetchWorker('/api/authenticate', {body:
			{action: 'DemonstrationSignIn.', name0: v.f0}})
		if (r.isSignedIn) {
			await doSignGet()//ttd march2025, this shouldn't be another round trip
		} else {
			refMessage.value = r.reason
		}
	} else {
		refMessage.value = 'Name not valid'
	}
}

async function clickedSignOut() {
	let r = await fetchWorker('/api/authenticate', {body:
		{action: 'DemonstrationSignOut.'}})
	if (r.isSignedOut) {
		await doSignGet()//ttd march2025, should not need another round trip
	} else {
		refMessage.value = r.reason
	}
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>AuthenticateDemo</i></p>

<!-- state 0: determining if there is a user signed in; show no controls yet -->

<!-- state 1: confirmed no user is signed in -->
<div v-show="refState == 1">
	<Button @click="refState = 2">Sign Up</Button>{{' '}}
	<Button @click="refState = 3">Sign In</Button>
</div>

<!-- state 2: clicked into "Sign Up" view -->
<div v-show="refState == 2">
	<p><Button link @click="refState = 1">← Back</Button></p>
	<p>Hello new person! To sign up, choose a new user name for yourself:</p>
	<p>
		<input type="text" v-model="refDesiredUserNameBox" placeholder="desired user name" />{{' '}}
		<Button @click="clickedSignUp()">Sign Up</Button>
	</p>
</div>

<!-- state 3: clicked into "Sign In" view -->
<div v-show="refState == 3">
	<p><Button link @click="refState = 1">← Back</Button></p>
	<p>Welcome back! Sign in with your existing user name:</p>
	<p>
		<input type="text" v-model="refReturningUserNameBox" placeholder="returning user name" />{{' '}}
		<Button @click="clickedSignIn()">Sign In</Button>
	</p>
</div>

<!-- state 4: user is signed in -->
<div v-show="refState == 4">
	<p><code>{{ refUserTag }}</code> user tag of <code>{{ refUserName }}</code> signed in</p>
	<p><Button @click="clickedSignOut()">Sign Out</Button></p>
</div>

<div>
	<p>{{refMessage}}</p>
</div>

</div>
</template>
