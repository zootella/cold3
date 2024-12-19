
# Cloudflare Turnstile Integration Guide

Cloudflare Turnstile is a modern, privacy-focused replacement for traditional CAPTCHAs that aims to minimize user friction while maintaining robust bot detection. Instead of asking users to solve tedious challenges, it operates largely behind the scenes, relying on automated checks and signals to determine whether a visitor is human. This approach helps ensure a more seamless and privacy-friendly experience compared to legacy solutions.

This guide demonstrates how to integrate Turnstile into a Nuxt 3 application hosted on Cloudflare Pages. In this scenario, Turnstile is used to protect a form that new users interact with during signup, specifically when they attempt to check whether their desired username is available. The frontend code is implemented using Vue 3’s Composition API, while the backend logic resides in a Nuxt 3 API endpoint running as a Cloudflare Worker. Both frontend and backend communicate using Nuxt’s $fetch function.

For more details on the fundamentals of Turnstile, refer to the official documentation: https://developers.cloudflare.com/turnstile/get-started/

## Manual Steps

Before integrating Turnstile into the code, you must perform a few manual configuration steps within the Cloudflare dashboard:

1. Navigate to Your Cloudflare Dashboard:
Log in to the Cloudflare dashboard and select the domain where you wish to deploy Turnstile.

2. Access the Turnstile Configuration Page:
From the Cloudflare dashboard, go to the Turnstile section. Here, you can manage Turnstile widgets for your site.

3. Create and Manage a Widget:
Click on "Manage widget" and create a new Turnstile widget. For example, you might name it turnstile1 and associate it with your domain (e.g., cold3.cc). Consult the domain management documentation if you need guidance on configuring hostnames:
https://developers.cloudflare.com/turnstile/concepts/domain-management/

4. Choose Widget Mode:
Select the "invisible" widget mode, which attempts to verify users silently without displaying a challenge. If pre-clearance is not needed, select "No" when asked about pre-clearance. For more information on pre-clearance and its implications, review the following documentation:
https://developers.cloudflare.com/turnstile/concepts/pre-clearance-support/
Additionally, Cloudflare’s blog post explains how Turnstile can integrate with the Cloudflare WAF to challenge suspicious requests: https://blog.cloudflare.com/integrating-turnstile-with-the-cloudflare-waf-to-challenge-fetch-requests/

5. Retrieve Your Keys:
Once the widget is created, the Cloudflare dashboard will provide you with two key values:

ACCESS_TURNSTILE_SITE_KEY: This is the public key used on the client side.
ACCESS_TURNSTILE_SECRET: This is the private secret key used for server-side verification.

Store these keys securely. The site key can be exposed in your public-facing code, but the secret key must remain private and accessible only on the server side.

With these manual setup steps complete, you can proceed to integrate the Turnstile widget and verification logic into your Nuxt 3 application.

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
Users interact wtih the choose name component before signing up.
We use Turnstile to protect the API endpoint
We've configured Turnstile to work, for most users most of the time, without any visual change or noticable time delay

```vue
<script setup>

import {
log, look, Now,
} from 'icarus'
import {ref} from 'vue'

let name = ref('')
let status = ref('(no status yet)')
function textChanged() {
  log(`text changed to "${name.value}"`)
  status.value = `entered ${name.value.length} characters`
}
async function buttonClicked() {
  log(`button clicked with name "${name.value}"`)

  try {
    let t = Now()
    let response = await $fetch('/api/name', {method: 'POST', body: {name: name.value}})
    let d = Now() - t

    status.value = `name api took ${d}ms to say: ${response.note}`
  } catch (e) {
    log('fetch caused exception:', look(e))
  }
}

</script>
<template>

<p>Check if your desired username is available.</p>
<input type="text" v-model="name" @input="textChanged" />
<button @click="buttonClicked">Check</button>
<p><i>{{ status }}</i></p>

</template>
```

[III: ./server/api/name.js]

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







