<script setup>

import {
log, look, Now, Time, Sticker,
} from 'icarus'
import {ref, watch, defineExpose} from 'vue'

let refTurnstileElement = ref(null)
let refTurnstileRendered = ref(false)
let refTurnstileToken = ref('')

onMounted(() => {
	if (Sticker().isCloud) {
		if (window.turnstile) {
			turnstileRender()
		} else {
			const intervalId = setInterval(() => {
				if (window.turnstile) {
					clearInterval(intervalId)
					turnstileRender()
				}
			}, 100)//poll ten times a second until window.turnstile becomes available
			//[]todo january--work this into the watch while you wait for both the user to get the form data ready, and turnstile to become ready--the submit button becomes available when all of those things are ready
		}
	}
})
const ACCESS_TURNSTILE_SITE_KEY_PUBLIC = '0x4AAAAAAA0P1yzAbb7POlXe'
function turnstileRender() {
	if (window.turnstile && refTurnstileElement.value) {
		window.turnstile.render(refTurnstileElement.value, {
			sitekey: ACCESS_TURNSTILE_SITE_KEY_PUBLIC,
			callback: turnstileCallback,
			size: 'invisible',//don't show the spinner or checkbox to the user unless things seem suspicious
			execution: 'execute',//don't generate a token now; we'll call turnstile.execute() to make the token later
		})
		refTurnstileRendered.value = true
	}
}

function turnstileExecute() {
	if (Sticker().isCloud && refTurnstileRendered.value /* window.turnstile && refTurnstileElement.value <-- changed checks */) {
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


</script>
<template>

<div ref="refTurnstileElement"></div>

</div>
</template>
