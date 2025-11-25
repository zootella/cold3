<script setup>//./components/TotpDemo.vue

import {
sayTick, Data,
totpEnroll, totpSecretIdentifier, totpValidate, totpGenerate, totpConstants,
browserIsBesideAppStore,
} from 'icarus'

//the page might refresh between enrollment steps 1 and 2; save the provisional secret encrypted by the server in a 20 minute cookie 🍪⌛
const refCookie = useCookie('totpTemporary', {
	maxAge: Limit.expiration / Time.second,//the browser will delete this cookie 20 minutes after we last set .value; cookies are timed in seconds not milliseconds
	sameSite: 'strict',//browser will include cookie in requests to our server only, which doesn't read it, this is the most restrictive setting, there isn't one for "don't send it at all"
	secure: isCloud(),//local development is http, cloud deployment is https, align with this to work both places
	path: '/',//we could restrict to certain routes, but this is simpler
	httpOnly: false,//true would mean page script couldn't read it
	//leaving out domain, so cookie will only be readable at the same domain it's set, localhost or cold3.cc, no subdomains
})

onMounted(async () => {

	if (hasText(refCookie.value)) {
		log('component loaded with stored cookie! 🍪🔔🔔🔔', refCookie.value)
		//in this case, we need to move right to step 2, ttd november
	}


	let response = await fetchWorker('/api/totp', {body: {action: 'Status.'}})
	log('response from Status.', look(response))
	/*
	possibilities at the start:
	- no user signed in
	- user with existing enrollment (controls to remove enrollment)
	- no user enrollment, cookie has provisional secret (controls to validate provisional enrollment)
	- no user enrollment (controls to enroll)

	different states of controls:
	- no enrollment (controls to start)
	- provisional enrollment (controls to validate and complete)
	- current enrollment (controls to remove)
	*/

	/*
	ttd november, bookmark next:
	split totp demo into two controls
	TotpEnrollDemo
	TotpValidateDemo

	and validate is easy, it just says not enrolled, or there's a box and the [ABC] code, and then it says correct or not
	*/



})

const refUri = ref('')
const refCode = ref('')
const refEnrollButton   = ref(null); const refEnrollEnabled   = ref(true); const refEnrollInFlight   = ref(false)
const refValidateButton = ref(null); const refValidateEnabled = ref(true); const refValidateInFlight = ref(false)

async function onEnroll() {
	let response = await refEnrollButton.value.post('/api/totp', {action: 'Enroll1.'})
	log('response from enroll 1', look(response))
	if (response.outcome == 'Candidate.') {

		log('previous and next client cookie values', refCookie.value, response.enrollment.envelope)
		refCookie.value = response.enrollment.envelope

		if (browserIsBesideAppStore()) {//on a phone, redirect to authenticator app
			window.location.href = response.enrollment.uri//ttd november, this is the plain html way, claude says best for otpauth on mobile; Nuxt has navigateTo, Vue Router has useRouter().push()
		} else {//on desktop, show the qr code
			refUri.value = response.enrollment.uri
		}
	} else {
		//bad response that isn't a 500
	}
}

async function onValidate() {
	let response = await refValidateButton.value.post('/api/totp', {
		action: 'Enroll2.',
		envelope: refCookie.value,
		code: refCode.value
	})
	log('response from enroll 2', look(response))
	if (response.outcome == 'Enrolled.') {
		refCookie.value = null//clear the cookie
		//success handling
	} else {
		//bad response that isn't a 500 (maybe make either success or 500 to not have to mess with stuff here!)
	}
}


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


	<div class="space-y-2">
		<p class="text-sm">Enter the 6-digit code from your authenticator app:</p>
		<input 
			v-model="refCode" 
			type="text" 
			inputmode="numeric"
			maxlength="6"
			placeholder="000000"
			class="px-3 py-2 border border-gray-300 rounded w-full text-center text-lg tracking-widest font-mono"
		/>
		<PostButton
			labelIdle="Validate Code" labelFlying="Validating..." :useTurnstile="false"
			ref="refValidateButton" :canSubmit="refValidateEnabled" v-model:inFlight="refValidateInFlight" :onClick="onValidate"
		/>
	</div>










</div>

</div>
</template>
