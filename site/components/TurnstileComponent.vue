<script setup>

import {
log, look, Now, Time, Sticker, toss,
useTurnstileHere,
} from 'icarus'
import {ref, onMounted} from 'vue'

const ACCESS_TURNSTILE_SITE_KEY_PUBLIC = '0x4AAAAAAA0P1yzAbb7POlXe'//from the cloudflare dashboard; intentionally public
const fresh = 4*Time.minute//cloudflare says a token expires 5 minutes; we don't submit one older than 4

//we begin the process of load+render+execute to get a first token right when the user navigates to the form
onMounted(() => {//this component has been rendered and inserted into the page's DOM. onMounted *never* runs on server hydration
	if (!useTurnstileHere()) return
	makeToken()//async but we don't need to await; just getting the process started
})

//the form using us calls here to get a token that's already been made, or make one and return it
async function getToken() {
	if (!useTurnstileHere()) return ''
	if (refToken.value.length) {//we're holding a token
		if (Now() < refTokenTick.value + fresh) {//and it's still fresh
			return exportToken()//return it
		} else {//but it's too old
			exportToken()//delete it, and keep going below
		}
	}
	await makeToken()//make a new one, coming back here when it's ready
	return exportToken()//return it, deleting our copy of it
}
defineExpose({getToken})

//how we hold our token, and then give it up to the form above
let refToken = ref('')//a token we made and are holding
let refTokenTick = ref(0)//when turnstile called us with it
function exportToken() {
	let token = refToken.value
	refToken.value = ''//delete our record of the token here; tokens only work submitted once
	refTokenTick.value = 0
	return token
}

//how we make a token, on mounted, or requested
let p//a promise so make token calls only happen one at a time
async function makeToken() {
	if (p) return p//we're already making a token; return the existing promise to let our caller wait in line
	p = (async () => {
		try {
			await step1Load()
			step2Render()
			await step3Execute()
		} finally {//no catch block; an exception will propegate upwards into where you called await makeToken() to get in here
			p = null//blank the promise so a later call can make another token, but still, one at a time
		}
	})()//execute this async function expression; instead of awaiting the promise it returns, save it as p
	return p//return the new promise so the caller will wait in line
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
			size: 'normal',//todo january, you'll change this to invisible along with changing a setting in the dashboard
			execution: 'execute',//don't generate a token now; we'll call turnstile.execute() to make the token in a separate step
		}
	)
}

//turnstile step 3 execute: turnstile puts the browser through ~2.3 seconds of cryptographic work, and in some cases shows the user a spinner or box they have to check
let resolve3, reject3//promisifying the turnstile callbacks
async function step3Execute() {
	log(`~~ execute turnstile`)
	window.turnstile.reset()//calling reset before every, even the first, execute, from turnstile's suggestion in the Console
	window.turnstile.execute(refTurnstileElement.value)//make a turnstile token
	return await new Promise((s, j) => { resolve3 = s; reject3 = j })//return here after turnstile has called our callback below, or throws from here on error
}
function turnstileCallback(token) {//turnstile has made a new token for us
	log(`~~ got token ${token.length} characters "${token.slice(0, 8)}...${token.slice(-8)}"`)
	refToken.value = token//save the token where export will deliver it from
	refTokenTick.value = Now()//record when we got the token to tell if it's near expiration in the future
	resolve3(token)//resolve the promise; calling with token lets return work even though we don't get it that way
}
function turnstileErrorCallback(errorCode) {//getting a error code number as a string, like "110200"
	reject3(new Error(errorCode))//reject the promsie with the given error code; wrapping it in an Error isn't necessary for the resulting exception to propegate upwards, but is more standard
}

</script>
<template>

<div ref="refTurnstileElement"></div>

</template>
