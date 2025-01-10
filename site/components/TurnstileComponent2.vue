<script setup>

import {
log, look, Now, Time, Sticker,
useTurnstileHere,
} from 'icarus'
import {ref, onMounted, /*defineExpose*/} from 'vue'//warning about defineExpose being a compiler macro that doesn't need to be imported

/*
here are the states of turnstile as we use it, from site load to second form submission:

[1] Included
app.vue useHead() includes the turnstile script always
the browser downloads and runs it as soon as the user visits the site,
way before they get to a form that might use a turnstile token.
this gives turnstile signals to block bots and let humans through

[2] Loaded
with async and defer true in head, it's possible the browser hasn't finished downloading and running the turnstile script yet
when it has, window.turnstile is an object
not reaching Loaded is nearly impossible--the user would have to fill out a form faster than cloudflare can serve a script
but we handle this race condition nonetheless

	(at this point, the user is clicking around the site, and turnstile is collecting signals
	further states happen only if the user clicks into a page that has a form that's using turnstile
	when the user does that, the form above has this <TurnstileComponent />, and Vue runs our onMounted(), below)

[3] Rendered
when the user is on a form that needs turnstile, we render the turnstile component
our call to window.turnstile.rander() is synchronous, but we make sure that we're Loaded, first

	(at this point, the user is filling out information in the form)

[4] Execute
when the user has got the form good enough that they could submit it, this is when we generate a turnstile token:

	let token = await turnstileExecute()

you get back the token to POST along with the information the user wrote in the form
while you're awaiting, turnstile might be making the browser do some computational work
in suspicious settings, it sometimes also shows a spinner or checkbox to the user

	(after all that, the user may want to submit the form again)

you can call turnstileExecute() again
just make sure not not call it again before your first call returns

in summary:
-why include everywhere? to let turnstile see more human signals
-why render on form load? because we only need turnstile on some forms, not everywhere
-why execute on form data good enough to submit? to avoid expired tokens, and to hide a time delay from the user:

this is better than making the token earlier, like when the user navigated to the form:
turnstile tokens only last 3 minutes, so if the user takes longer to fill out the form, we'd submit an expired token
this is also better than making the token later, like when the user submits the form:
when turnstile makes a token it causes the browser to do some cryptographic work
while this might only take a few hundred milliseconds,
we can still hide that delay in the amount of time between the user finishing filling out the form and pressing submit!
*/

let refTurnstileElement = ref(null)//once we're mounted, Vue sets this to the HTMLDivElement the browser assigned

onMounted(() => {//this component has been rendered and inserted into the page's DOM. onMounted *never* runs on server hydration
	if (useTurnstileHere()) {//we only use turnstile deployed to the cloud, but can turn this on for local development
		if (window.turnstile) {//turnstile is loaded already from app.vue useHead(); this is likely
			turnstileRender()
		} else {//the browser is still downloading and running the turnstile script from cloudflare; unlikely but possible
			const interval = setInterval(() => {
				if (window.turnstile) {
					clearInterval(interval)
					turnstileRender()
				}
			}, 100)//poll ten times a second until turnstile is loaded
		}
	}
})
const ACCESS_TURNSTILE_SITE_KEY_PUBLIC = '0x4AAAAAAA0P1yzAbb7POlXe'
let resolve1; let promise1 = new Promise(s => { resolve1 = s })//promisifying the load and render steps
function turnstileRender() {
	log('~~ turnstile render!')
	window.turnstile.render(//this call returns synchronously, and when it does, turnstile is ready to execute
		refTurnstileElement.value,//this DOM element is where turnstile could show the user as a spinner or checkbox during token generation
		{
			sitekey: ACCESS_TURNSTILE_SITE_KEY_PUBLIC,
			callback: turnstileCallback,//after we call execute(), turnstile will give this callback the token
			'error-callback': turnstileErrorCallback,			
			size: 'normal',
			/*
			size options are: "invisible"|"normal"|"compact"|"flexible"
			related is the dashboard's Widget Mode options of: ()Managed|(x)Non-interactive|()Invisible
			*/
			execution: 'execute',//don't generate a token now; we'll call turnstile.execute() to make the token later
		}
	)
	resolve1()//turnstile is loaded and rendered; let a call to execute below proceed
}

let resolve2, reject2, promise2//promisifying the execute and wait for callback step
async function turnstileExecute() {//generate a new turnstile token on the page to POST along with form submission from an untrusted user
	log('~~ turnstile execute!')
	if (promise2) toss('state')//you can call turnstileExecute() again, but only after a awaiting call has returned
	let token
	try {
		await promise1//return here after turnstile is loaded and rendered
		window.turnstile.reset()//calling reset before every, even the first, execute, from a suggestion in the Console
		window.turnstile.execute(refTurnstileElement.value)//make a turnstile token
		promise2 = new Promise((s, j) => { resolve2 = s; reject2 = j })//set promise2 truthy to block an overlapping call into execute
		token = await promise2//return here after turnstile has called our callback below
	} finally {
		promise2 = null//let an exception throw upwards, but keep promise2 correct as a marker for execution in progress
	}
	return token
}
defineExpose({turnstileExecute})//let the form that we're a part of call turnstileExecute() to make and get a token to POST
function turnstileCallback(token) {//turnstile has made a new token for us
	log(`~~ turnstile callback! token is ${token.length} characters: ${token}`)
	resolve2(token)//resolve the promise with the token so turnstileExecute can return it
}
function turnstileErrorCallback(errorCode) {//getting a error code number as a string, like "110200"
	log(`~~ turnstile ERROR callback! error code is ${errorCode}`)
	reject2(errorCode)
}

</script>
<template>

<div ref="refTurnstileElement"></div>

</template>
