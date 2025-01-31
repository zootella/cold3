<script setup>

import {
log, look, Now, sayTick, newline, Data, Tag,
getBrowserTag, isLocal,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'

let refBrowserTag = ref('')//the browser here's tag, read from local storage
let refUserTagBox = ref('')//text in the box on the page
let refUserSignedIn = ref('')//what user is signed in here, according to the server
let refOutput = ref({})//result from most recent api call

onMounted(async () => {//doesn't run on server, even when hydrating
	refBrowserTag.value = getBrowserTag()//read browser tag from local storage
	let r = await $fetch(//ask the server who's signed in here
		'/api/signin', {method: 'POST', body: {action: 'SignGet.', browserTag: refBrowserTag.value}})
	refOutput.value = r
	refUserSignedIn.value = r.result
})

async function clickedSignIn() {
	log(`clicked sign in with user tag box "${refUserTagBox.value}"`)
	refOutput.value = await $fetch(
		'/api/signin', {method: 'POST', body: {action: 'SignIn.', browserTag: refBrowserTag.value, userTag: refUserTagBox.value}})
}
async function clickedSignOut() {
	log('clicked sign out')
	refOutput.value = await $fetch(
		'/api/signin', {method: 'POST', body: {action: 'SignOut.', browserTag: refBrowserTag.value, userTag: refUserSignedIn.value}})
}

</script>
<template>

<p>sign in component</p>
<p>this browser's tag is <i>"{{ refBrowserTag }}"</i></p>
<p>signed in here is user tag <i>"{{ refUserSignedIn }}"</i> blank if no user signed in</p>

<div>
User Tag <input type="text" v-model="refUserTagBox" />{{' '}}
<button @click="clickedSignIn()" class="pushy">Sign In</button>{{' '}}
<button @click="clickedSignOut()" class="pushy">Sign Out</button>
</div>


<pre>{{ refOutput }}</pre>

</template>
