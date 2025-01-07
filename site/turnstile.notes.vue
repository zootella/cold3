
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

(a) Load script globally.
(b) Render widget in the component.
(c) Execute token generation when the user is about to submit the form. (earlier, the token may expire; later, there may be a noticable delay)
(d) Send token in a form submission ($fetch).
(e) Verify token on the server using Turnstile’s /siteverify.

## (a) app.vue – Load the Turnstile script globally

* Ensures the Turnstile library is downloaded site-wide, as early as possible.
* useHead in app.vue is the reccommended way to load global scripts in nuxt 3
* Does not slow down page load, or show anything to the user. async and defer mean the browser downloads and runs the cloudflare turnstile script in parallel with the page loading normally

at this point, turnstile is on the site, quietly observing user behavior for better bot detection

./app.vue
```vue
<script setup>
useHead({
	script: [
		{
			src: 'https://challenges.cloudflare.com/turnstile/v0/api.js',
			async: true,
			defer: true
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

## (b) turnstile.render – Render the Turnstile widget for use in a component

* The user navigates to a sign-up form component. Since these users are not signed in yet, we need Turnstile to protect the form’s API endpoint.
* We attach Turnstile to <div ref="refTurnstileElement">. If Turnstile needs a visible challenge, it will appear here.
* Nuxt runs onMounted only on the client, after the component is inserted into the DOM. We immediately try to call turnstileRender(). If the Turnstile script isn’t ready yet (loaded async in app.vue), we poll until window.turnstile becomes available.
* size: 'invisible' keeps Turnstile hidden unless suspicious behavior prompts a challenge.
* execution: 'execute' defers token generation until we explicitly call .execute(). This prevents token expiration if the user lingers on the form.

./components/ExampleComponent.vue
```vue
<script setup>
import { ref, onMounted } from 'vue'
let refTurnstileElement = ref(null)

onMounted(() => {
	if (window.turnstile) {
		turnstileRender()
	} else {
		const intervalId = setInterval(() => {
			if (window.turnstile) {
				clearInterval(intervalId)
				turnstileRender()
			}
		}, 100)
	}
})
function turnstileRender() {
	if (window.turnstile && refTurnstileElement.value) {
		window.turnstile.render(refTurnstileElement.value, {
			sitekey: 'YOUR_TURNSTILE_SITE_KEY',
			callback: turnstileCallback,
			size: 'invisible',//don't show the spinner or checkbox to the user unless things seem suspicious
			execution: 'execute'//don't generate a token now; we'll call turnstile.execute() to make the token later
		})
	}
}

</script>
<template>
	<div ref="refTurnstileElement"></div>
</template>
```

## (c) turnstile.execute – Generate a Turnstile token when the form is ready to submit

* Once the form is valid and the user is ready to submit, call turnstile.execute(...) to generate a fresh token.
* Possible Delay: Turnstile may perform CPU-intensive operations (e.g., hashing) or display a spinner or challenge if the user’s behavior appears suspicious.
* Invisible for Most Users: Under normal conditions, users see no prompt—Turnstile issues a token quickly in the background.
* Callback: When Turnstile finishes, it calls your turnstileCallback function with the newly generated token. You store the token for use in your POST request.

./components/ExampleComponent.vue
```vue
<script setup>
let refTurnstileElement = ref(null)
let refTurnstileToken = ref('')
let refTermsAccepted = ref(false)

watch([refTermsAccepted], () => {
	if (formIsValid() && !refTurnstileToken.value) {
		turnstileExecute()
	}
})
function turnstileExecute() {
	if (window.turnstile && refTurnstileElement.value) {
		window.turnstile.execute(refTurnstileElement.value)//ask turnstile to make a new token
	}
}
//possible time delay, spinner, or interactive challenge happens between these two here
function turnstileCallback(token) {//turnstile has made a new token for us
	refTurnstileToken.value = token
}

</script>
<template>
	<label><input type="checkbox" v-model="refTermsAccepted" />Accept Terms</label>
	<div ref="refTurnstileElement"></div>
	<button :disabled="!refTurnstileToken">Submit</button>
</template>

## (d) POST - Include the Turnstile token in the form submission

* Include the Turnstile Token in your request body alongside the rest of your form fields.

./components/ExampleComponent.vue
```vue
<script setup>

async function onSubmit() {
	try {
		const response = await $fetch('/api/submit-form', {
			method: 'POST',
			body: {
				name: refName.value,
				turnstileToken: refTurnstileToken.value
			}
		})
		refStatus.value = `Server says: ${response.message}`
	} catch (e) {
		refStatus.value = 'Submission failed. Please try again.'
		console.error('Error posting form:', e)
	}
}
</script>
<template>
	<label><input type="checkbox" v-model="refTermsAccepted" />Accept Terms</label>
	<div ref="refTurnstileElement"></div>
	<button :disabled="!refTurnstileToken">Submit</button>
</template>

(e) api – Validate the token with the Cloudflare Challengese platform in trusted code on the server side

// ./server/api/submit-form.js
```js
export default defineEventHandler(async (event) => {

	const body = await readBody(event)
	const { name, turnstileToken } = body
	const config = useRuntimeConfig()
	const secretKey = config.TURNSTILE_SECRET

	const verificationResponse = await $fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			secret: secretKey,
			response: turnstileToken
		})
	})
	if (!verificationResponse.success) {
		throw createError({ statusCode: 403, statusMessage: 'turnstile token not valid' })
	}

	return { message: `Form submission accepted for ${name}` }
})
```


check this as a whole, please--im looking for mistakes in how the guide describes interactions related to
-web standards
-how browsers work
-how to correctly use nuxt 3 with vue's composition api
-how to correctly use turnstile with our choices to generate the token before submit, and keep things as invisible as possible











./components/FormComponent.vue

<script setup>
import {ref} from 'vue'
const refTurnstileComponent = ref()
async function onFormContentsSubmittable() {
	//call when the form is ready to submit
	//await; may be really fast, may be a second with user interaction
  let token = await refTurnstileComponent.value.runTurnstileToMakeToken()
	//returns the turnstile token, include token with form data in POST
}
</script>

<template>
<p>This is the outer parent component with the form</p>
<TurnstileComponent ref="refTurnstileComponent" />
</template>

./components/TurnstileComponent.vue

<script setup>
import {ref, defineExpose} from 'vue'
async function runTurnstileToMakeToken() {
	return 'token'
}
defineExpose({runTurnstileToMakeToken})
</script>

<template>
<p>This inner child component keeps and runs turnstile for outer parent forms that need it</p>
</template>

you've defined and exposed your own async function turnstile()
call it when the user has gotten the form ready to submit
it may take no time, or an undetectable 100ms or so
or, it may show the spinner or checkbox on the page, and take that interaction and a second to run
await the call, and you'll get back the turnstile token
the forms submit button, unavailable while the user is filling out the form
should stay unavailable while turnstile is running
when turnstile returns, you've got the token, make submit available for the user to press
when the user presses submit, POST the turnstile token with the form data






































