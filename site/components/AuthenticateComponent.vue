<script setup>

import {
log, look, Now, sayTick, newline, Data, Tag, hasText,
getBrowserTag, isLocal,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'

/*
bookmark january

no password yet, just a user name you choose
also for this v0.01 really simple normalization, like only letters numbers and -_.
purpose here is to make a system where you can easily type in different chrome profiles
and confirm that it works as you expect
and the database table records are as you expect
as a test of your schema and way of reading it

pretty cool you've separated this concern even from password
and after this you'll work on (a)hide and (b)delete account
and also (c)anonymous users who get started leaving data before they sign up
this seedling is enough to get those three powerful features right
*/

let refState = ref(0)//to begin, determining what our browser tag and user tag are
let refBrowserTag = ref('')//the browser here's tag, read from local storage
let refUserTag = ref('')//the user tag of the user who is signed in to this browser right now
let refUserName = ref('')//the user name of that tag, signed in, according to the server
//(in practice, we won't show a browser tag, because sharing those is dangerous, and we likely won't ever send a user tag to the page, because while not sensitive, there is no reason to do so--the server must look this up each time it needs it to get a trusted answer; it's not ok for a browser to state "this is my user tag", rather, the browser does say "this is my browser tag" and then it is the *server* that decides what user, if any, is signed in there)
let refDesiredUserNameBox = ref('')
let refReturningUserNameBox = ref('')

onMounted(async () => {//doesn't run on server, even when hydrating
	refBrowserTag.value = getBrowserTag()//read browser tag from local storage
	await doSignGet()
})

async function doSignGet() { return//ttd february, turned this off for the next draft of browser_table and name_table
	let r = await $fetch('/api/authenticate', {method: 'POST', body:
		{action: 'AuthenticateSignGet.', browserTag: refBrowserTag.value}})
	if (r.result.userTag) {//server tells us we've got a user signed into this browser here
		refState.value = 4
		refUserTag.value = r.result.userTag
		refUserName.value = r.result.routeText
	} else {//server tells us, no user is signed in here based on our browser tag
		refState.value = 1
	}
}

async function clickedSignUp() { return
	let r = await $fetch('/api/authenticate', {method: 'POST', body:
		{action: 'AuthenticateSignUp.', browserTag: refBrowserTag.value, userName: refDesiredUserNameBox.value}})
	log(look(r))
	await doSignGet()
}
async function clickedSignIn() { return
	let r = await $fetch('/api/authenticate', {method: 'POST', body:
		{action: 'AuthenticateSignIn.', browserTag: refBrowserTag.value, userName: refReturningUserNameBox.value}})
	log(look(r))
	await doSignGet()
}
async function clickedSignOut() { return
	let r = await $fetch('/api/authenticate', {method: 'POST', body:
		{action: 'AuthenticateSignOut.', browserTag: refBrowserTag.value}})
	log(look(r))
	await doSignGet()
}

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
