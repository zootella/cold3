<script setup>//./components/TotpDemo.vue

import {
sayTick, Data,
totpEnroll, totpSecretIdentifier, totpValidate, totpGenerate, totpConstants,
browserIsBesideAppStore,
} from 'icarus'

/*
ok, here we have all the pieces, now it's time to get the flow complete and correct with some parts happening on the server
and, we can use trail table to do everything without needing a new database table!

remember that user and issuer text don't actually do anything other than go through the uri into the authenticator app!

from memory, faster than chat
user clicks generate on page
server picks secret for user, saves proof of it
server sends secret to page
page shows qr code to user
user scans qr with authenticator app
user enters current code to page and submits to server
server answers yes valid or no not valid

ok, on the setup flow
the server can bounce the secret back onto the page, saving its hash in 
and then on first validation, the page posts
why doesn't this let the page tamper with or choose the secret? because only the true secret has the hash record
so you think the setup flow doesn't need any custom database

on the second factor later flow
the secret necessarily remains secret on the server
the user is already signed in with a first factor,
so the server knows if they have a totp enrollment, and what their secret is
this does take another table, which i guess will map user tag to totp enrollment
or, there might be a user validation table that has a totp column,
or lots of rows about a user that show how the
yeah, it's going to be that

ok so for otp email and sms, you had to make a separate table
because of all the rules around timing and expiration and duplicates
here you don't because it's simpler







you can do totp using existing database tables, which is great


trail table:
- holds proof that the server made a secret during enrollment
- enforces rate limit to shield brute force attacks
authenticate table:
- maps user tag to secret with type tag like "Totp."















here you don't because the secret is too long to guess even at full speed


type-variable 

in this demo, we're just doing the setup flow



why can't the



user enters code from 
page knows 

*/

const refLabel = ref('user.name@example.com')
const refUri = ref('')

let enrollment
async function generate() {
	enrollment = await totpEnroll({label: refLabel.value, issuer: Key('totp, issuer, public, page'), addIdentifier: true})
	refUri.value = enrollment.uri
	//ttd august2025, this demo is all client side, an actual implementation of totp would never call generate, and would create and keep the secret on the server side. you've made /api/totp as the start of the real implementation!
}

function redirect() {
	window.location.href = enrollment.uri//ttd august2025, this is the plain html way, claude says best for otpauth on mobile; Nuxt has navigateTo, Vue Router has useRouter().push()
}

let interval
onMounted(() => { interval = setInterval(repeater, 66) })
onUnmounted(() => { if (interval) clearInterval(interval) })
async function repeater() { if (!enrollment) return
	let secret = Data({base32: enrollment.secret})

	let t = Now()
	refCodePrev.value = await totpGenerate(secret, t - (30*Time.second))
	refCodeHere.value = await totpGenerate(secret, t)
	refCodeNext.value = await totpGenerate(secret, t + (30*Time.second))
	refCodeTime.value = sayTick(t)
}

const refCodePrev = ref('')
const refCodeHere = ref('')
const refCodeNext = ref('')
const refCodeTime = ref('')









const refButton5 = ref(null)
const refButton5CanSubmit = ref(true)//set to true to let the button be clickable, the button below is watching
const refButton5InFlight = ref(false)//the button below sets to true while it's working, we can watch

async function onClick5() {
	let result = await refButton5.value.post('/api/totp', {
		action: 'Enroll1.',
	})
}




















</script>
<template>
<div class="border border-gray-300 p-2 bg-gray-100 space-y-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>TotpDemo</i></p>

<div>
	<PostButton
		labelIdle="Snippet" labelFlying="Snippeting..." :useTurnstile="false"
		ref="refButton5" :canSubmit="refButton5CanSubmit" v-model:inFlight="refButton5InFlight" :onClick="onClick5"
	/>
</div>

<div class="grid grid-cols-[auto_1fr] gap-x-2 gap-y-2 items-center">
	<p>Generate a new RFC6238 TOTP enrollment</p>
	<p class="text-right m-0">User:</p><input v-model="refLabel" class="px-2 py-2 border border-gray-300 rounded" />
	<Button @click="generate" class="justify-self-start">Generate</Button>
</div>

<p>
	Is this a phone or tablet with an authenticator app or app store?
	{{browserIsBesideAppStore() ? '📲 ✅ YES' : '💻 🚫 NO'}}
</p>

<div v-if="refUri" class="space-y-2">
	<p>Generated enrollment information:</p>
  <pre class="whitespace-pre-wrap break-words">{{enrollment}}</pre>
  <p>On mobile, we'll automatically: <Button @click="redirect">Redirect to the default authenticator app</Button></p>
  <p>On desktop, we'll show a QR code:</p>
  
  <div class="flex justify-center py-2">
    <div class="flex items-center gap-4">
      <div class="flex-shrink-0">
        <QrCode :address="refUri" />
      </div>
      
      <div class="space-y-2">
      	<p>The server and authenticator app share the secret, and use it with the time to generate matching codes:</p>
        <p><code>{{refCodePrev}}</code> previous code</p>
        <p><code>{{refCodeHere}}</code> current code</p>
        <p><code>{{refCodeNext}}</code> upcoming code</p>
        <p><code>{{refCodeTime}}</code></p>
        <p>
        	Above and beyond the standard implementation, we can tell the user,
        	<i>the listing you're looking for is marked "[{{enrollment.identifier}}]"</i>
        </p>
      </div>
    </div>
  </div>
</div>

</div>
</template>
