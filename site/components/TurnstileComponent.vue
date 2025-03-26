<script setup>

import {
log, look, Now, Time, Sticker, toss, hasText,
useTurnstileHere,
} from 'icarus'
import {ref, onMounted} from 'vue'

/*
ttd march
you've factored this into PostButton, so the widget stays near the button, and a form using PostButton can easily use turnstile or not
but now stress testing on web, you can break turnstile internally by clicking between two routes that have post buttons with turnstile
the chat suggested fix is to call turnstile.reset(), but your design already does that
you also managed to get turnstile to say that we sent an alredy submitted token!

the problem here is that turnstile is fundamentally global on the page, window.turnstile
but your design puts it within the button

a redesign, which you're not doing to do now, might look something like this
- turnstile is always global to the page--it doesn't keep with the button that needs to post its token
- the widget is always invisible, and we render it very last thing on the page (if it truly stays invisible, this will be fine, if somehow it shows a checkbox, the user will need to scroll all the way down to see what's going on)
- when a component renders a post button with turnstile on, the turnstile widget container instantiates the turnstile widget
so, imagine a second button on the page also does this
or the user leaves that route, tearing down the button, and then returns to it, quickly, rendering the button again
all of this is fine because the turnstile container is based, and wakes up, makes a token, even if lots of different buttons above it are shouting at it
- then, one of those buttons needs the token, turnstile gives it up, and remembers that it needs a new one

ok, so how do we do this?
does this mean we do turnstileStore after all?
that makes it so a fly by night button, or several buttons, can all talk to the same single store
which solidly keeps it single state

but then how does the turnstile component container work?
you want it at the bottom of the page, but you also want it to not do anything unless a post button has rendered that will need a token to post

also, how can the buttons talk to 











*/

const ACCESS_TURNSTILE_SITE_KEY_PUBLIC = '0x4AAAAAAA0P1yzAbb7POlXe'//from the cloudflare dashboard; intentionally public
const fresh = 4*Time.minute//cloudflare says a token expires 5 minutes; we don't submit one older than 4

//we begin the process of load+render+execute to get a first token right when the user navigates to the form
onMounted(() => {//this component has been rendered and inserted into the page's DOM. onMounted *never* runs on server hydration
	if (!useTurnstileHere()) return//we only use turnstile deployed to the cloud, but can turn this on for local development
	makeToken()//async but we don't need to await; just getting the process started
})

//the form using us calls here to get a token that's already been made, or make one and return it
async function getToken() {
	if (!useTurnstileHere()) return ''
	if (hasText(token.text)) {//we're holding a token
		if (Now() < token.tick + fresh) {//and it's still fresh
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
let token = {}//token.text will be the token we're holding, and token.tick will be when we got it
function exportToken() {
	let t = token.text
	token = {}//delete our record of the token here; tokens only work submitted once
	return t
}

//how we make a token, on mounted, or requested
let p//a promise so makeToken() calls only happen one at a time
let once//true when steps 1 through 3, which we only do once, are done
async function makeToken() {
	if (p) return p//we're already making a token; return the existing promise to let our caller wait in line
	p = (async () => {
		try {
			if (!once) { once = true
				/* step 1 insert already done by app.vue's useHead() insertion of the turnstile script into the site */
				await step2Load()
				step3Render()
			}
			await step4Execute()
		} finally {//no catch block; an exception will propegate upwards into where you called await makeToken() to come here
			p = null//blank the promise so a later call can make another token, but still, one at a time
		}
	})()//execute this async function expression; instead of awaiting the promise it returns, save it as p
	return p//return the new promise so the caller will wait in line
}

//turnstile step 2 load: make sure window.turnstile is there
async function step2Load() {//app.vue's useHead included turnstile when the user first came to the site, but make sure it's loaded
	if (window.turnstile) return Promise.resolve()//already loaded; return an already resolved promise to let the await call here through
	return new Promise((s, j) => {//the browser is still downloading and running the turnstile script from cloudflare; unlikely but possible; return a promise that resolves when turnstile appears
		let i = setInterval(() => {
			if (window.turnstile) { clearInterval(i); s() }//call the given resolve function s(), letting the await call here through
		}, 100)//poll ten times a second
	})
}

//turnstile step 3 render: get the widget ready to make tokens
let refTurnstile = ref(null)//once mounted, Vue sets this to the HTMLDivElement the browser assigned the <div> from the template below
function step3Render() {
	window.turnstile.render(//this call returns synchronously, and when it does, turnstile is ready to execute
		refTurnstile.value,//this DOM element is where turnstile could show the user as a spinner or checkbox during token generation
		{
			sitekey: ACCESS_TURNSTILE_SITE_KEY_PUBLIC,
			callback: turnstileCallback,//after we call execute(), turnstile will give this callback the token
			'error-callback': turnstileErrorCallback,			
			size: 'normal',//todo january, you'll change this to invisible along with changing a setting in the dashboard
			execution: 'execute',//don't generate a token now; we'll call turnstile.execute() to make the token in a separate step
		}
	)
}

//turnstile step 4 execute: turnstile puts the browser through ~2.3 seconds of cryptographic work, and in some cases shows the user a spinner or box they have to check
let resolve4, reject4//promisifying the turnstile callbacks
async function step4Execute() {
	log(`~~ execute turnstile`)
	window.turnstile.reset()//calling reset before every, even the first, execute, from turnstile's suggestion in the Console
	window.turnstile.execute(refTurnstile.value)//make a turnstile token
	return await new Promise((s, j) => { resolve4 = s; reject4 = j })//return here after turnstile has called our callback below, or throws from here on error
}
function turnstileCallback(t) {//after making the browser hash and maybe the user click, turnstile has made a new token for us
	log(`~~ got token ${t.length} characters "${t.slice(0, 8)}...${t.slice(-8)}"`)
	token = {text: t, tick: Now()}//save the token and record when we got it
	resolve4(t)//resolve the promise; calling with token lets return work even though we don't get it that way
}
function turnstileErrorCallback(errorCode) {//getting a error code number as a string, like "110200"
	reject4(new Error(errorCode))//reject the promsie with the given error code; wrapping it in an Error isn't necessary for the resulting exception to propegate upwards, but is more standard
}

</script>
<template>

<div ref="refTurnstile"></div>

</template>
