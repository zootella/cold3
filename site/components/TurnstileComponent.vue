<script setup>

import {
log, look, Now, Time, Sticker,
useTurnstileHere,
} from 'icarus'
import {ref, watch, defineExpose} from 'vue'

let refTurnstileElement = ref(null)
let refTurnstileToken = ref('')
let refTurnstilePromise = ref(null)

/*
here are the states of turnstile as we use it, from site load to second form submission:

1 included - starting point when using turnstile; already the case because turnstile is in app.vue
2 loaded - may have to wait for this; detect with if (window.turnstile)
3 rendered - only async if we're waiting for mounted; call render() in form component onMounted
4 executed - call execute() when user has got form data ready to submit; async through possible spinner; makes token
5 submitted - call submit() when you're going to POST the token; component needs to know to not use it again

if the user wants to use the form again, states 4 and 5 happen again--earlier states aren't repeated

so here's how you do it all with a single async function: await turnstileExecute()
you include <TurnstileComponent /> in your form, and it takes care of mounting and rendering
when the form is ready to submit, you call await turnstileExecute()
which waits for mounted and rendered, if those haven't finished yet, and then makes the token, maybe showing the spinner
then, it returns the token to submit; at this point, it assumes you're going to use that token
if the user wants to use the form again, call await turnstileExecute() again, and you'll get a new token

if you call turnstileExecute() twice, toss
if you call turnstileExecute() before things are ready, it just includes that in the await
*/

/*
first part: automatic from app.vue and onMounted - get ready for the user to call execute
*/

onMounted(() => {
	if (useTurnstileHere()) {
		if (window.turnstile) {
			turnstileRender()
		} else {
			const intervalId = setInterval(() => {
				if (window.turnstile) {
					clearInterval(intervalId)
					turnstileRender()
				}
			}, 100)//poll ten times a second until window.turnstile becomes available
		}
	}
})
const ACCESS_TURNSTILE_SITE_KEY_PUBLIC = '0x4AAAAAAA0P1yzAbb7POlXe'
let resolve1; let promise1 = new Promise(resolve => { resolve1 = resolve })//promisifying the load and render steps
function turnstileRender() {
	log('turnstile render!')
	if (window.turnstile && refTurnstileElement.value) {
		window.turnstile.render(refTurnstileElement.value, {//this returns synchronously, and when it does, turnstile is ready to execute
			sitekey: ACCESS_TURNSTILE_SITE_KEY_PUBLIC,
			callback: turnstileCallback,//after we call execute(), turnstile will give this callback the token
			size: 'invisible',//don't show the spinner or checkbox to the user unless things seem suspicious
			execution: 'execute',//don't generate a token now; we'll call turnstile.execute() to make the token later
		})
		resolve1()//turnstile is loaded and rendered; let a call to execute below proceed
	}
}

/*
second part: when the form is ready to go, we get our execute() call--wait if first part isn't done, and then wait as we make the token
return the token, marking it as made, getting ready for a second call to execute later
if a second call comes in here during this, toss
*/

let resolve2; let promise2 = new Promise(resolve => { resolve2 = resolve })//promisifying the execute and wait for callback step
async function turnstileExecute() {
	log('turnstile execute!')
	await promise1//make sure turnstile is loaded and rendered
	window.turnstile.execute(refTurnstileElement.value)//ask turnstile to make a new token, which may take a little time or show a spinner or checkbox to the user
	return await promise2//stay here until turnstile calls our callback
}
function turnstileCallback(token) {//turnstile has made a new token for us
	log(`turnstile callback! token is ${token.length} characters`)
	refTurnstileToken.value = token
	resolve2(token)
}





/*
i'm trying to code my own function, useTheSystem(), below
it's async, and will await and return the result from the platform's async function, systemExecute
the difficulty is this: the platform documentation warns against calling systemExecute until the system is ready
and the way for me to find out the system is ready is to register a callback function

but i want to group these two async things (first, system ready; second, waiting for execute to finish) into a single async function im writing, useTheSystem

is this a common JavaScript pattern?
is my sample solution below correct?
is there a better or more standard solution to this problem?
*/

//i need to turn a callback into 

import {registerCallback, systemExecute} from 'some_example_platform'

let myResolver//save the resolver function the promise constructor gives us when we make the promise
let myPromise = new Promise(resolve => { myResolver = resolve })//make a promise that we'll take from pending to fulfilled

function callback() {//external platform code will call our callback function here when the system is ready
	myResolver()
}
registerCallback(callback)//here, we're telling the platform to use our callback, so we can know when the system is ready

async function useTheSystem() {
	await myPromise//don't proceed until the platform is ready
	return await systemExecute()//the API function systemExecute is async; we await it and return what it gives us
}





/*
ok, so this is all fine, execpt when our code calls await useTheSystem(), it's possible that the system isn't ready yet!
this is a JavaScript question now, generalized away from any specific API or platform or system
what is the best way to "pause" execution at [A] until the system is ready?
(of course, nothing will really pause, as other events, like the callback, can happen, as JavaScript is event based and asynchronous)
also, to make [A] work well, we can absolutely add code to position [B]
*/









async function turnstileExecute() {
	if (useTurnstileHere() && refTurnstileRendered.value /* window.turnstile && refTurnstileElement.value <-- changed checks */) {
		log('hi in name component turnstile execute; executing to get a token...')
		window.turnstile.execute(refTurnstileElement.value)//ask turnstile to make a new token
	}
}
//possible time delay, spinner, or interactive challenge happens between these two here
function turnstileCallback(token) {//turnstile has made a new token for us
	log('...callback got token: '+token)
	refTurnstileToken.value = token
}



/*
[]factor turnstile into this component which is easy for a form that needs turnstile protection to use

[]also, make turnstile a noop when local, maybe all the way up to app.vue?
[]and, you have to make this not reuse a token! have it keep the token, and zero it out once used, maybe
unless that is a complex pattern to keep track of
*/

async function runTurnstileToMakeToken() {
	return 'token'
}
defineExpose({runTurnstileToMakeToken})
/*
ok, but how do you communicate your token is ready back up to the parent component?
your idea was await the exposed function
but are worried you can't find more than two mentions of defineExpose in the official documentation
so maybe the more standard and introductory message passing pattern is better here

FormComponent has a TurnstileComponent
and sends it commands like:
-1 render, meaning prepare to make a token
-2 execute, meaning make a token now
and the component sends messages back up, like
-1 rendered, ready for you to call execute
-2 executed, and here is your token
ok but then what happens if:
-the form calls render and execute back to back, and we're still polling? we need to cache the execute request and do it as soon as we're done
-the form tries to double-use a token; instead there should be a clear way to get a second working token when the user tries new info in the form

okay, lots to think about here




*/






async function myFunction() {
	return new Promise((resolve, reject) => {
		turnstilePromise.value = resolve; // keep reference to resolve so we can call it later
		
		// Make the call that eventually leads to callbackFunction being invoked
		platformApiCall();
	});
}

// The platform calls this at some later time with the result
function callbackFunction(result) {
	// complete the Promise we created in myFunction
	if (turnstilePromise.value) {
		turnstilePromise.value(result);
		turnstilePromise.value = null; // avoid issues if callback is called multiple times
	}
}































































</script>
<template>

<div ref="refTurnstileElement"></div>

</div>
</template>
