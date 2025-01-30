<script setup>

import {
log, look, Now, sayTick, newline, Data, Tag,
getBrowserTag, isLocal,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'

/*
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
*/

/*
no password yet, just a user name you choose
also for this v0.01 really simple normalization, like only letters numbers and -_.
purpose here is to make a system where you can easily type in different chrome profiles
and confirm that it works as you expect
and the database table records are as you expect
as a test of your schema and way of reading it

pretty cool you've separated this concern even from password
and after this you'll work on hide and delete account

put borders around authenticate component using really simple css, too
and have small text for tags and names, fixed width

Authenticate Component

(signed in)
FT1YfEzz9aiwdtZiJw379 browser tag
isa5nR1sj9AZnkqextbHH user tag
Alice1 user name
[Sign Out]

(not signed in)
[Sign Up] [Sign In]

(not signed in, sign up)
_< Back_
[user name] [Sign Up]

(not signed in, sign in)
_< Back_
[user name] [Sign In]

bookmark january
^[]first, just get those states working front end


*/


</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>AuthenticateComponent</i></p>

<p>a paragraph, hi</p>
<code>some code</code>
<input type="text" v-model="refUserTagBox" />{{' '}}
<button @click="clickedSignIn()">Sign In</button>{{' '}}


<p>authenticate component</p>
<p>this browser's tag is <i>"{{ refBrowserTag }}"</i></p>
<p>signed in here is user tag <i>"{{ refUserSignedIn }}"</i> blank if no user signed in</p>

<div>
User Tag <input type="text" v-model="refUserTagBox" />{{' '}}
<button @click="clickedSignIn()">Sign In</button>{{' '}}
<button @click="clickedSignOut()">Sign Out</button>
</div>


<pre>{{ refOutput }}</pre>

</div>
</template>
<style scoped>


</style>
