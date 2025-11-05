<script setup>//./components/TotpDemo.vue

import {
sayTick, Data,
totpEnroll, totpSecretIdentifier, totpValidate, totpGenerate, totpConstants, checkTotpSecret, checkTotpCode,
browserIsBesideAppStore,
} from 'icarus'

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



//between enrollment steps 1 and 2, we need to remember the secret, but flipping to the authenticator app could cause a refresh

const totpEnrollSecret = useCookie('totpTemporary', {//make a client side cookie so this component can save a temporary note that survives an accidental page refresh
  maxAge: totpConstants.enrollmentExpiration / Time.second,//tell the browser to delete the value 20 minutes after we set it
  sameSite: 'strict',// Don't send on cross-site requests (CSRF protection)
  secure: true,           // HTTPS only
  path: '/',              // Available throughout your app
  httpOnly: false,        // ⚠️ Must be false so JavaScript can read it
  // domain: undefined    // Default: current domain only
})


/*
the user will return in a moment from their authenticator app, but what happens if they refresh? the browser could tombstone
while the user is 
*/


















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
