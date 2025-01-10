
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










/*
a simple form with turnstile; let's figure out and standardize the states

first
form is blank, user begins filling it out
turnstile is not executing
post is not in flight
button is gray

second
the user has gotten form contents submittable
DO turnstile execute to get the token; may show spinner or checkbox
button is gray

third
form contents still submittable
turnstile execute has finished; we have the token
DO make the button green

fourth
user has clicked the green button
DO post form data and token to endpoint
DO make the button orange

fifth
post has returned
DO uncheck the box, which will take things back to first
*/



	/*
	actions to take here:
	get the token - when nothing is in flight, the form is ready
	make the button green - 
	make the button orange - when post is in flight
	*/

	if (false) {
		log('before turnstile execute')
		refTurnstileComponent.value.turnstileExecute().then((token) => {
			//the idea is when you set the token, another call to watch comes in

			//instead of await, you might actually want to use then here, so you get a separate function that isn't going to keep going later in watch. ironic, i know, but still. also, then (get it?) the watch handler isn't async any more, which might work but looks like trouble
			log('after turnstile execute, got token length '+token.length)
			refTurnstileToken.value = token
		})
	}




	try {
		refGettingResponse.value = true

		let body = {
			name: refName.value,
			terms: refTerms.value,
			turnstileToken: refTurnstileToken.value
		}
		log(look(body))

		let response = await $fetch('/api/name', {
			method: 'POST',
			body: {
				name: refName.value,
				terms: refTerms.value,
				turnstileToken: refTurnstileToken.value
			}
		})
		refStatus.value = `server response: ${response.note}`
	} catch (e) {
		refStatus.value = `fetch threw error: ${e.message}`
	} finally {
		refTerms.value = false//uncheck the box, but keep the name the same
		refDuration.value = Now() - t
		refGettingResponse.value = false
		log('flight completed')
	}













			//choices here are "invisible", "normal", "compact", "flexible", but compact is way bigger than normal!
			//to see the spinner, you changed the dashboard from Invisible to Non-interactive, and changed this setting from "invisible" to "normal"
			/*
			ttd january
			if you don't like the way the widget looks, it will be easy to generate your own spinner
			without moving the submit button, have a spot that says something like "one moment as we check for bots..." or something
			and have that animate
			and only show up if it's been 400ms or something that we're making the user wait

			what if the user finishes the form, and then lingers? the token will expire
			so a really sophisticated TurnstileComponent would notice this, and *regenerate* the token after 2.5 minutes or something

			the other option, which would only work if it's true that non interactive means there's never a checkbox
			would be to bury the turnstile delay in the submission
			this is the most expected for the user, as servers are commonly slow (not here at cold3.cc, though!)
			so, this is simpler and better, but breaks the following way if the widget suddenly shows its checkbox
			the user presses submit, the button turns disabled and orange, and then jumps downwards, because rendered above it is another thing to do--the checkbox
			so, that's pretty unacceptable, but also typical for these days of the horrible broken web
			and you could code it up that way until you see someone get a checkbox appear

			documented behavior is turnstile non-interactive could still show a checkbox
			but observed behavior is that it doesn't
			also the name, non-interactive, seems to indicate there won't be a checkbox

			if you do this, then there are two timeouts to observe--how long token generation happened, and how long the POST took
			*/






ok, so if you switch to bury the turnstile darkpenny time in the orange submit
does that mean you don't have to uncheck the box?
you think so

user naviages to form, blank
user fills out form, not submittable yet
user gets the form submittable: turnstile token starts
user clicks submit: button turns orange

as soon as the turnstile token is generated, form automatically POSTs to the api endpoint
the whole time, the button is orange

response received--the form is still submittable, the token has been blanked
the button goes back to green
now if the user wants to submit the form again, they press the button again
their click starts the second turnstile token execution+api POST sequence, orange the whole time

so that's a pretty complex state machine
and if you're back in there redesigning it, maybe also keep track of when a token is 2 minutes old and should be refreshed
there can only be one .execute() at a time
you're already calling .refresh() before every .execute(), and that's working well
so then the following things can prompt making a new token:
-once the first time, the user has gotten the form ready to submit
-the user has pressed submit (without a current execute in flight, of course, probably a second use)
and separately a 2*Time.minute timeout can throw away an expired token

yeah, that's a pretty good design
and if cloudflare decides this user really does need an interactive checkbox, then the experience is:
-the user fills out the form, the button goes gray to green
-the user presses Submit, the button goes animate orange (which is again disabled to prevent a second click)
-below the button, a new annoying checkbox cloudflare thing appears, the user checks it; the orange button above is still spinnin'
-the whole thing works
ok, so that isn't that bad, actually
and as a whole, this is a better design than making the user wait, after filling out the form, to be able to press submit



currently just an orange button, in actual desing of course there will be:
[]animation on the button to assure the user things are under way
[]instrumentation through datadog or something to measure how long real users are delayed by turnstile+POST 





ok, let's take a step back here
the amount of time between a user getting form data submittable, and pressing Submit, is probably less than a second
and the turnstile token generation times you're seeing are like 3 seconds
so taking the amount of time the user must wait down to 2.5 seconds from 3 seconds isn't really significant

favoring simplicity, especially considering client side state logic (with vue, web3, turnstile, everything) gets really crazy really fast, may be the best approach
users will only interact with turnstile once, when signing in--then they stay signed in indefinitely
so you could just do this really simple approach:
1 user visits blank form, button gray, turnstile quiet
2 user fills out form, button green, turnstile quiet
3 user presses submit: button orange, submit handler always does these two things one after the other: generate token, then POST to api
also done this way, you don't have to worry about expired tokens--the page only generates a token right before submitting it, so they're by definition fresh

ok, so that's the simple option
now you've thought of the alternative fancy one

if there's always going to be a 3 second delay, and you want to hide that from the user,
generate the token as soon as the user visits the form
you have to code in the following fancy timing:
-when the user presses submit, if there's a token in flight, you wait for it, if not, you do token+post
-if the token expires, you blank it--don't recreate it; have submit take 4 seconds in this unusual case
as usually goes with these things, you're currently thinking "yeah, that's not too bad"

if cloudflare wants to show the checkbox, then it'll appear right at the start, or while the user is filling out the form
so, it may make sense to put the widget above the submit button--if it shows, it'll push the submit button down before the user gets to the end


can you build token expiration into TurnstileComponent?
when it's made a token, it starts a 1*Time.second interval to notice when it's expired
and set an expiration time to 2 minutes or something--documentation says 5 minutes, you remember seeing something about 3 minutes, maybe from chat
in testing you'll make that like 10 seconds or something
and when it's expired, it blanks its own record as well as calling window.turnstile.reset()
this assumes you can call reset twice in a row, but you probably can


so with this design, TurnstileComponent does all of the following onLoad:
waits for load
renders
executes to make a token
(and after an expiration time)
resets and blanks the token

and then when the form calls getToken or whatever
if it has a token, it returns it immedately
if it's in the process of making a token, it awaits for that to finish and returns it
if there's not token nor execution in flight, it executes and awaits, to return the token

yeah, that's sorta complicated
but you like it how you may be able to comparmentalize it all into TokenComponent
and you like it how your observed behavior of turnstile, in that it takes 3 seconds but doesn't show a checkbox, is completely hidden from the user signing up or in for the first time






































