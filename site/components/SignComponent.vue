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
})
//something this doesn't do yet is cache the signed-in status once we know it; each call here bothers the database. not doing that here because we'll do that in pinia soon

async function signGet() {
	return (await signFetch({action: 'SignGet.'})).signedIn2//returns true or false we're signed in
}
async function signOut() {
	await signFetch({action: 'SignOut.'})//no return, but throws on server reports error
}
async function signIn(password) {
	return await signFetch({action: 'SignIn.', password})//returns the server body, with details like bad password
}
defineExpose({signGet, signOut, signIn})

async function signFetch(body) {
	body.browserTag = browserTag
	return await $fetch('/api/account', {method: 'POST', body})
	//totally fine to let exceptions go all the way up to the component that called us, remember (but check to see what this is like!)
}

//note no template below (which apparently is OK), but we're still a component to use onMounted
</script>










