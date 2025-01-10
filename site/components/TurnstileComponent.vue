<script setup>

import {
log, look, Now, Time, Sticker, toss,
useTurnstileHere,
} from 'icarus'
import {ref, onMounted} from 'vue'

//we begin the process of load+render+execute to get a first token right when the user navigates to the form
onMounted(() => {//this component has been rendered and inserted into the page's DOM. onMounted *never* runs on server hydration
	makeToken()
})

//how to get a token
async function getToken() {
	if (!useTurnstileHere()) toss('local')//we shouldn't be trying to use turnstile here
	if (refToken.value.length) {//we're holding a token
		if (Now() < refTokenBirthtick.value + tokenFresh) {//and it's still fresh
			return exportToken()//return it
		} else {//but it's too old
			exportToken()//delete it, and keep going below
		}
	}
	await makeToken()//make a new one, coming back here when it's ready
	return exportToken()//return it, deleting our copy of it
}
defineExpose({getToken})

//how we hold and move out our token
let refToken = ref('')//a token we made and are holding
let refTokenBirthtick = ref(0)//when we got it from turnstile
const tokenFresh = 4*Time.second//cloudflare says a token expires in 5 minutes; we're using 4 seconds for testing and 4 minutes for real
function exportToken() {
	let token = refToken.value
	refToken.value = ''//delete our record of the token here; exportToken() passes it from this component to you
	refTokenBirthtick.value = 0
	return token
}

//how we make a token
let promise1
async function makeToken() {
	if (promise1) return promise1//we're already making a token; return the existing promise to let our caller wait in line
	promise1 = (async () => {
		try {
			await step1Load()
			step2Render()
			await step3Execute()
		} finally {//no catch block; an exception will propegate upwards into where you called await makeToken() to get in here
			promise1 = null//blank the promise so a later call can make another token, but still, one at a time
		}
	})()//execute this async function expression; instead of awaiting the promise it returns, save it
	return promise1//return the new promise so the caller will wait in line
}

//turnstile step 1 load: make sure window.turnstile is there
async function step1Load() {//app.vue's useHead included turnstile when the user first came to the site, but make sure it's loaded
	if (window.turnstile) return Promise.resolve()//already loaded; return an already resolved promise to let the await call here through
	return new Promise((s, j) => {//we have to wait, very unlikely; return a promise that resolves when turnstile is loaded
		let i = setInterval(() => {
			if (window.turnstile) { clearInterval(i); s() }//call the given resolve function s(), letting the await call here through
		}, 100)//poll ten times a second
	})
}

//turnstile step 2 render: get the widget ready to make tokens
const ACCESS_TURNSTILE_SITE_KEY_PUBLIC = '0x4AAAAAAA0P1yzAbb7POlXe'
let refTurnstileElement = ref(null)//once we're mounted, Vue sets this to the HTMLDivElement the browser assigned
let rendered = false//we render once, even if we then execute multiple times
function step2Render() {
	if (rendered) return; rendered = true
	window.turnstile.render(//this call returns synchronously, and when it does, turnstile is ready to execute
		refTurnstileElement.value,//this DOM element is where turnstile could show the user as a spinner or checkbox during token generation
		{
			sitekey: ACCESS_TURNSTILE_SITE_KEY_PUBLIC,
			callback: turnstileCallback,//after we call execute(), turnstile will give this callback the token
			'error-callback': turnstileErrorCallback,			
			size: 'normal',
			execution: 'execute',//don't generate a token now; we'll call turnstile.execute() to make the token later
		}
	)
}

//turnstile step 3 execute: make the browser hash and possibly show the user a spinner or checkbox to generate a token
let resolve3, reject3//promisifying the turnstile callbacks
async function step3Execute() {
	log(`~~ execute turnstile`)
	window.turnstile.reset()//calling reset before every, even the first, execute, from turnstile's suggestion in the Console
	window.turnstile.execute(refTurnstileElement.value)//make a turnstile token
	return await new Promise((s, j) => { resolve3 = s; reject3 = j })//return here after turnstile has called our callback below, or throws from here on error
}
function turnstileCallback(token) {//turnstile has made a new token for us
	log(`~~ got token ${token.length} characters "${token.slice(0, 8)}...${token.slice(-8)}"`)
	refToken.value = token
	refTokenBirthtick.value = Now()
	resolve3(token)//resolve the promise with the token so turnstileExecute can return it
}
function turnstileErrorCallback(errorCode) {//getting a error code number as a string, like "110200"
	reject3(errorCode)//reject the promsie with the given error code
}

</script>
<template>
<div>

<div>turnstile {{ refState }}</div>
<div ref="refTurnstileElement"></div>

</div>
</template>
