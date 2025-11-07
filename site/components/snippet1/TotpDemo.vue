<script setup>//./components/TotpDemo.vue

import {
sayTick, Data,
totpEnroll, totpSecretIdentifier, totpValidate, totpGenerate, totpConstants, checkTotpSecret, checkTotpCode,
browserIsBesideAppStore,
} from 'icarus'

//the page might refresh between enrollment steps 1 and 2; save the provisional secret encrypted by the server in a 20 minute cookie 🍪⌛
const refCookie = useCookie('totpTemporary', {
	maxAge: totpConstants.enrollmentExpiration / Time.second,//the browser will delete this cookie 20 minutes after we last set .value
	sameSite: 'strict',//browser will include cookie in requests to our server only, which doesn't read it, this is the most restrictive setting, there isn't one for "don't send it at all"
	secure: isCloud(),//local development is http, cloud deployment is https, align with this to work both places
	path: '/',//we could restrict to certain routes, but this is simpler
	httpOnly: false,//true would mean page script couldn't read it
	//leaving out domain, so cookie will only be readable at the same domain it's set, localhost or cold3.cc, no subdomains
})

const refEnrollButton = ref(null); const refEnrollEnabled = ref(true); const refEnrollInFlight = ref(false)
const refUri = ref('')

async function onEnroll() {
	let response = await refEnrollButton.value.post('/api/totp', {action: 'Enroll1.'})
	log('response from enroll 1', look(response))
	if (response.outcome == 'Candidate.') {
		//in a moment we'll send the user to their authenticator app, after which they'll return to the page. they might do a nervous swipe refresh, or the phone or browser might tombstone the page. for step 2 to work, this component has to ugh you're going to have to symmetric encrypt the secret and store that in the 20min cookie. the browser might tombstonebefore we send the user to their authentithe user 

		if (browserIsBesideAppStore()) {//on a phone, redirect to authenticator app
			window.location.href = response.enrollment.uri//ttd november, this is the plain html way, claude says best for otpauth on mobile; Nuxt has navigateTo, Vue Router has useRouter().push()
		} else {//on desktop, show the qr code
			refUri.value = response.enrollment.uri
		}
	}
}









/*
the user will return in a moment from their authenticator app, but what happens if they refresh? the browser could tombstone
while the user is 
*/






//ttd november, when you do Key(), you can go around and replace literal 'cold3.cc' with Key('domain, public, page') which is a lot better











</script>
<template>
<div class="border border-gray-300 p-2 bg-gray-100 space-y-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>TotpDemo</i></p>

<div>
	<PostButton
		labelIdle="Enroll" labelFlying="Requesting new enrollment..." :useTurnstile="false"
		ref="refEnrollButton" :canSubmit="refEnrollEnabled" v-model:inFlight="refEnrollInFlight" :onClick="onEnroll"
	/>
</div>

<div v-if="refUri" class="space-y-2">
	<div class="flex justify-center py-2">
		<div class="flex items-center gap-4">
			<div class="flex-shrink-0">
				<QrCode :address="refUri" />
			</div>
		</div>
	</div>
</div>

</div>
</template>
