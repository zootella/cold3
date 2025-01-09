








# Cloudflare Turnstile Integration Guide

Cloudflare Turnstile is a modern, privacy-focused replacement for traditional CAPTCHAs that aims to minimize user friction while maintaining robust bot detection. Instead of asking users to solve tedious challenges, it operates largely behind the scenes, relying on automated checks and signals to determine whether a visitor is human. This approach helps ensure a more seamless and privacy-friendly experience compared to legacy solutions.

This guide demonstrates how to integrate Turnstile into a Nuxt 3 application hosted on Cloudflare Pages. In this scenario, Turnstile is used to protect a form that new users interact with during signup, specifically when they attempt to check whether their desired username is available. The frontend code is implemented using Vue 3’s Composition API, while the backend logic resides in a Nuxt 3 API endpoint running as a Cloudflare Worker. Both frontend and backend communicate using Nuxt’s $fetch function.

For more details on the fundamentals of Turnstile, refer to the official documentation:
https://developers.cloudflare.com/turnstile/get-started/

## Manual Steps

Before integrating Turnstile into the code, you must perform a few manual configuration steps within the Cloudflare dashboard.
Create a new turnstile widget, and choose these settings:

widget name: turnstile1
hostname management: cold3.cc
widget mode: invisible
pre-clearance: no

and then get the site key and secret key, which in our code will be:

ACCESS_TURNSTILE_SITE_KEY_PUBLIC, available to untrusted front-end code, revealed to users
ACCESS_TURNSTILE_SECRET, securely and secretly stored in the cloudflare worker

## Example site-wide client-code code

[I: ./app.vue]
Load Turnstile site-wide as soon as possible, allowing it to observe user behavior before they reach the protected form.

```vue
<script setup>
  useHead({
    title: 'cold3.cc',
    script: [
      {
        src: 'https://challenges.cloudflare.com/turnstile/v0/api.js',
        async: true,//tell the browser: you can download this script while you're parsing the HTML
        defer: true//but don't run the script until the html is fully parsed
      }
    ]
  })
</script>
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

[II: ./components/NameComponent.vue]
Consider a component that lets a new user see if their desired username is available.
Users interact with this component before they've signed up, so it needs to be hardened against attack.
We use Turnstile to protect the API endpoint.
We've configured Turnstile to work, for most users most of the time, without any visual change or noticable time delay.



Turnstile is already globally loaded via app.vue (so window.turnstile is available).

The user must check the “Accept Terms” box before submitting.

When the box is checked, we generate a Turnstile token (invisible most of the time, but if Turnstile flags anything suspicious, a spinner or checkbox might appear in the <div ref="turnstileEl"></div>).

Upon pressing Submit (“Check” button), we include the token alongside the name in a POST request to the protected API endpoint.



```vue
<script setup>

	import {ref} from 'vue'
	let refName = ref('')
	let refTerms = ref(false)
	let refStatus = ref('(no status yet)')

// Turnstile references
const turnstileEl = ref(null)
const turnstileToken = ref('')

	function termsAccepted() {
		//the user is about to submit the form--do turnstile

	}
	async function buttonClicked() {
	  try {
	    let response = await $fetch('/api/name', {method: 'POST', body: {name: refName.value}})
	    //also send turnstile

	    refStatus.value = `That user name is: ${response.note}`
	  } catch (e) {
	    log('caught:', e)
	  }
	}

</script>
<template>

	<p>Check if your desired username is available.</p>
	<input type="checkbox" v-model="refTerms" id="idTerms" /><label for="idTerms">Accept Terms</label>
	<input type="text" v-model="refName" />
	<button @click="buttonClicked">Check</button>
	<p><i>{{ refStatus }}</i></p>

</template>
```

[III: ./server/api/name.js]
The api handler checks the availability of the user name
It also validates the turnstile token that the page submitted

```js
import {
log, look, toss, doorWorker, Sticker,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
  return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
  let o = {}

  o.note = `name api will check "${door.body.name}" in ${Sticker().all}`

  return o
}
```




















































# Cloudflare Turnstile Integration Guide

Cloudflare Turnstile is a modern, privacy-focused replacement for traditional CAPTCHAs that aims to minimize user friction while maintaining robust bot detection. Instead of asking users to solve tedious challenges, it operates largely behind the scenes, relying on automated checks and signals to determine whether a visitor is human. This approach helps ensure a more seamless and privacy-friendly experience compared to legacy solutions.

This guide demonstrates how to integrate Turnstile into a Nuxt 3 application hosted on Cloudflare Pages. In this scenario, Turnstile is used to protect a form that new users interact with during signup, specifically when they attempt to check whether their desired username is available. The frontend code is implemented using Vue 3’s Composition API, while the backend logic resides in a Nuxt 3 API endpoint running as a Cloudflare Worker. Both frontend and backend communicate using Nuxt’s $fetch function.

For more details on the fundamentals of Turnstile, refer to the official documentation:
https://developers.cloudflare.com/turnstile/get-started/

## Manual Steps

Before integrating Turnstile into the code, you must perform a few manual configuration steps within the Cloudflare dashboard.
Create a new turnstile widget, and choose these settings:

widget name: turnstile1
hostname management: cold3.cc
widget mode: invisible
pre-clearance: no

and then get the site key and secret key, which in our code will be:

ACCESS_TURNSTILE_SITE_KEY_PUBLIC, available to untrusted front-end code, revealed to users
ACCESS_TURNSTILE_SECRET, securely and secretly stored in the cloudflare worker

## Example site-wide client-code code

[I: ./app.vue]
Load Turnstile site-wide as soon as possible, allowing it to observe user behavior before they reach the protected form.

```vue
<script setup>
  useHead({
    title: 'cold3.cc',
    script: [
      {
        src: 'https://challenges.cloudflare.com/turnstile/v0/api.js',
        async: true,//tell the browser: you can download this script while you're parsing the HTML
        defer: true//but don't run the script until the html is fully parsed
      }
    ]
  })
</script>
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

[II: ./components/NameComponent.vue]
Consider a component that lets a new user see if their desired username is available.
Users interact with this component before they've signed up, so it needs to be hardened against attack.
We use Turnstile to protect the API endpoint.
We've configured Turnstile to work, for most users most of the time, without any visual change or noticable time delay.

```vue
<script setup>

import {ref} from 'vue'

let name = ref('')
let status = ref('(no status yet)')

async function buttonClicked() {

  try {
    let response = await $fetch('/api/name', {method: 'POST', body: {name: name.value}})

    status.value = `That user name is: ${response.note}`
  } catch (e) {
    log('caught:', e)
  }
}

</script>
<template>

<p>Check if your desired username is available.</p>
<input type="text" v-model="name" />
<button @click="buttonClicked">Check</button>
<p><i>{{ status }}</i></p>

</template>
```

[III: ./server/api/name.js]
The api handler checks the availability of the user name
It also validates the turnstile token that the page submitted

```js
import {
log, look, toss, doorWorker, Sticker,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
  return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
  let o = {}

  o.note = `name api will check "${door.body.name}" in ${Sticker().all}`

  return o
}
```













(c) Submit the form along with the valid Turnstile token to your server endpoint for verification.


./app.vue
```vue
<!-- app.vue -->
<template>
  <NuxtPage />
</template>

<script setup>
// No special code needed in the script here, just ensure the script tag below is present.
</script>

<head>
  <!-- Include Turnstile script globally, so it's available throughout the site -->
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head>
```

## Example client-side code

./components/NameComonent.vue
```vue
<!-- ./components/NameComponent.vue -->
<template>
  <form @submit.prevent="onSubmit">
    <!-- Container for Turnstile widget; invisible mode, triggered by execute() -->
    <div ref="turnstileEl"></div>
    
    <input v-model="desiredName" type="text" placeholder="Enter desired username" required />
    <button type="submit">Check</button>
  </form>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRuntimeConfig } from '#app'

const config = useRuntimeConfig()
const turnstileSiteKey = config.public.ACCESS_TURNSTILE_ID
const desiredName = ref('')
const turnstileToken = ref('')
const turnstileEl = ref(null)

// Callback after token is generated
function onTurnstileSuccess(token) {
  turnstileToken.value = token
  submitForm()
}

// Render Turnstile in invisible mode, so no UI until executed
function renderTurnstile() {
  if (window.turnstile && turnstileEl.value) {
    window.turnstile.render(turnstileEl.value, {
      sitekey: turnstileSiteKey,
      callback: onTurnstileSuccess,
      size: 'invisible', 
      // Use 'execute' mode so we can control when token is generated
      execution: 'execute'
    })
  }
}

onMounted(() => {
  // If not globally loaded, ensure script is loaded. 
  // If you placed it in app.vue or a plugin, Turnstile should already be available.
  if (window.turnstile) {
    renderTurnstile()
  } else {
    const interval = setInterval(() => {
      if (window.turnstile) {
        clearInterval(interval)
        renderTurnstile()
      }
    }, 100)
  }
})

function onSubmit() {
  if (!window.turnstile || !turnstileEl.value) {
    alert('Verification system not ready. Please try again later.')
    return
  }
  // Execute Turnstile to get a fresh token right now
  window.turnstile.execute(turnstileEl.value)
}

async function submitForm() {
  try {
    const response = await $fetch('/api/check-name', {
      method: 'POST',
      body: {
        name: desiredName.value,
        turnstileToken: turnstileToken.value
      }
    })
    
    if (response.available) {
      alert('Username is available!')
    } else {
      alert('Username is taken. Please choose another.')
    }
  } catch (error) {
    console.error('Error:', error)
    alert('Failed to verify or check the name. Please try again.')
  }
}
</script>

<style scoped></style>
</script>

<style scoped>
/* Optional: Style the Turnstile container if needed */
</style>
```

## Example server side code

./server/api/check-name.js
```js
<script>
// ./server/api/check-name.js
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, turnstileToken } = body

  // Verify the Turnstile token
  const verificationResponse = await $fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: ACCESS_TURNSTILE_SECRET,
      response: turnstileToken
    })
  })

  if (!verificationResponse.success) {
    throw createError({ statusCode: 403, statusMessage: 'Bad Turnstile token' })
  }

  // If verification passed, check username availability
  const available = await checkNameAvailability(name)

  return { available }
})
</script>
```

questions:

(1) should the tunrstile widget be in app.vue, where it will be rendered throughout the user's session with the site, or just within the component? official documentation seems to indicate a site using turnstile anywhere should have it in the html head, right from the start, and always--is this correct? if so, what's the right way to do that in nuxt 3?

(2) let's say the form to protect is short; users will complete it quickly. alternatively, let's say the form is long, a user might navigate to the page, leave it open for minutes as the user collects information from the form, and submit it after a longer delay. should turnstile be used differently in those cases. we want form submission to not be delayed, but we also want to not send an old, possibly expired token

(3) in the normal, non-attack scenario, will the challenge api ever say no? what's the flow for a user who is not a bot, but (for whatever reason) turnstile thinks is high-risk

(4) what settings are there to control the strength of the widget, for instance, to set it to be more secure, even if it bothers more users, or less secure, never bothering a user

(5) if the visual indicator appears, where does it appear within the html of the page? are there any options to affect its visual appearance, such as, to style it?

(6) is there a way a site can collect data on how many users saw the widget, and for how many the experience was entirely invisible

(7) does turnstile use cookies? is there a way to use turnstile without cookies, for users who have turned cookies off or do not wish to make a choice about them?







imagine this flow:
(a) turnstile is part of the root page, so cloudflare can observe real user behavior long before the user navigates to the form
(b) when the form is complete and ready to submit (not earlier, when the form is rendered, and not later, when the user presses the submit button) that is when script gets the token which must be submitted and verified and lasts for 300 seconds. earlier, and there could be failures with expired tokens; later, and the form submission could be slower for the user
(c) form submission includes the turnstile token, which the worker then validates
ok, so we want to get that in short simple code that is secure and also correct to (and a correct and common use of) the turnstile api, in the context of a nuxt 3 app






<!-- app.vue -->
<template>
  <NuxtPage />
</template>

<head>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head>

<script setup>
</script>




<!-- app.vue -->
<template>
  <NuxtPage />
</template>

<script setup>
useHead({
  script: [
    { src: 'https://challenges.cloudflare.com/turnstile/v0/api.js', async: true, defer: true }
  ]
})
</script>












previous one:

<template>
<div>

<Head>
  <Title>cold3.cc</Title>
  <Link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍺</text></svg>" />
</Head>

<NuxtPage />

</div>
</template>













































fin
















<script>
/*
const turnstileSiteKey = config.public.ACCESS_TURNSTILE_ID

let name = ref('')
let status = ref('(no status yet)')

const turnstileEl = ref(null)
const turnstileToken = ref('')

function textChanged() {
  log(`text changed to "${name.value}"`)
  status.value = `entered ${name.value.length} characters`
}

// When Turnstile succeeds, store the token
function onTurnstileSuccess(token) {
  turnstileToken.value = token
}

function renderTurnstile() {
  if (window.turnstile && turnstileEl.value) {
    window.turnstile.render(turnstileEl.value, {
      sitekey: turnstileSiteKey,
      callback: onTurnstileSuccess,
      size: 'invisible',
      execution: 'execute'
    })
  }
}

onMounted(() => {
  // Wait until Turnstile script is ready, then render the widget
  if (window.turnstile) {
    renderTurnstile()
  } else {
    const i = setInterval(() => {
      if (window.turnstile) {
        clearInterval(i)
        renderTurnstile()
      }
    }, 100)
  }
})

// Watch the name field. Once user starts typing and we don't yet have a token, request one.
watch(name, () => {
  if (name.value.length > 0 && !turnstileToken.value && turnstileEl.value && window.turnstile) {
    window.turnstile.execute(turnstileEl.value)
  }
})

async function buttonClicked() {
  log(`button clicked with name "${name.value}"`)

  if (!turnstileToken.value) {
    alert('Verification in progress, please wait a moment and try again.')
    return
  }

  try {
    let t = Now()
    let response = await $fetch('/api/name', {
      method: 'POST',
      body: {
        name: name.value,
        turnstileToken: turnstileToken.value
      }
    })
    let d = Now() - t
    status.value = `name api took ${d}ms to say: ${response.note}`
  } catch (e) {
    log('fetch caused exception:', look(e))
  }
}
*/
</script>















/*
<p>Check if your desired username is available.</p>
<p>
	Name: <input type="text" v-model="refName" @input="somethingChanged" />
</p>
<p>
  <input type="checkbox" v-model="refTerms" @change="somethingChanged" /> Accept Terms
	<button :disabled="refButtonDisabled" @click="buttonClicked">Check</button>
</p>
<p>Status: <i>{{ refStatus }}</i></p>
*/


/*
	try {
		let t = Now()
		let response = await $fetch('/api/name', {method: 'POST', body: {name: refName.value}})
		let d = Now() - t

		refStatus.value = `name api took ${d}ms to say: ${response.note}`
	} catch (e) {
		log('fetch caused exception:', look(e))
	}
*/



























<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRuntimeConfig } from '#app'
import { log } from 'icarus'

const config = useRuntimeConfig()
const turnstileSiteKey = config.public.ACCESS_TURNSTILE_ID

// Form fields
const refName = ref('')
const refTerms = ref(false)
const refStatus = ref('(no status yet)')

// Turnstile references
const turnstileEl = ref(null)
const turnstileToken = ref('')

// When Turnstile successfully issues a token, store it
function onTurnstileSuccess(token) {
  turnstileToken.value = token
  log('Turnstile token received:', token)
}

// Render Turnstile in “invisible execute” mode
function renderTurnstile() {
  if (window.turnstile && turnstileEl.value) {
    window.turnstile.render(turnstileEl.value, {
      sitekey: turnstileSiteKey,
      callback: onTurnstileSuccess,
      size: 'invisible',
      execution: 'execute'
    })
  }
}

// On component mount, ensure the Turnstile script has loaded, then render
onMounted(() => {
  if (window.turnstile) {
    renderTurnstile()
  } else {
    const interval = setInterval(() => {
      if (window.turnstile) {
        clearInterval(interval)
        renderTurnstile()
      }
    }, 100)
  }
})

// Watch the “Accept Terms” checkbox
// When user checks it (becomes true), generate a Turnstile token
watch(refTerms, (newVal) => {
  if (newVal && !turnstileToken.value && turnstileEl.value && window.turnstile) {
    window.turnstile.execute(turnstileEl.value)
  }
})

// When the user clicks the “Check” button
async function buttonClicked() {
  // Enforce that “Accept Terms” is checked
  if (!refTerms.value) {
    alert('Please accept the terms first.')
    return
  }

  // Ensure we have a Turnstile token
  if (!turnstileToken.value) {
    alert('Verification is still in progress. Please wait a moment.')
    return
  }

  try {
    const response = await $fetch('/api/name', {
      method: 'POST',
      body: {
        name: refName.value,
        turnstileToken: turnstileToken.value
      }
    })
    refStatus.value = `That user name is: ${response.note}`
  } catch (err) {
    log('caught:', err)
    refStatus.value = 'Something went wrong.'
  }
}
</script>

<template>
  <p>Check if your desired username is available.</p>
  
  <!-- Turnstile container (invisible, but will appear if suspicious activity is detected) -->
  <div ref="turnstileEl"></div>
  
  <input type="checkbox" v-model="refTerms" id="idTerms" />
  <label for="idTerms">Accept Terms</label>

  <input 
    type="text" 
    v-model="refName" 
    placeholder="Enter desired username" 
  />

  <button @click="buttonClicked">Check</button>
  
  <p><i>{{ refStatus }}</i></p>
</template>











additional notes about component communication coming next













			//[]todo january--work this into the watch while you wait for both the user to get the form data ready, and turnstile to become ready--the submit button becomes available when all of those things are ready













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
ok, now let's modify this to allow multiple calls to execute
if there's an execute call in flight, that's not allowed--i want to throw an exception! calling code should never do that
but, it is valid for calling code to do let token = await turnstileExecute(), get the token, and then later, want to repeat the process

here are my ideas about how to do this:
-while promise1 needed to be outside so turnstileExecute could await it, promise2 has a simpler job; we could move it into turnstileExecute entirely
-even if that's true and we do that refactor, resolve2 needs to be on the margin so turnstileCallback can reach it

we need a mechanism so that if a second call comes into turnstileExecute, it throws

*/

let executing = false
async function oneAtATimePlease() {
	if (executing) toss('state')
	executing = true
	try {
		let r = await someApiCall()
	} finally {
		executing = false
	}//if the api call throws, we need to set executing before we leave, but *do* want the exception to propegate upwards
	return r
}
//im learning about promises in javascript, and want to make sure that while this async function can be called a second time after a first call returns, while execution is awaiting inside, a second call is blocked. is this a common pattern? is the solution i came up with here common or correct? (as in, first, does it work, and second, is this the best practice solution for this problem)











		//[]todo january--work this into the watch while you wait for both the user to get the form data ready, and turnstile to become ready--the submit button becomes available when all of those things are ready

















