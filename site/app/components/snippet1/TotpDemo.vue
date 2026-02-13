<script setup>

import {
sayTick, Data,
totpEnroll, totpIdentifier, totpValidate, totpGenerate, totpConstants,
browserIsBesideAppStore,
} from 'icarus'

//the page might refresh between enrollment steps 1 and 2; save the provisional secret encrypted by the server in a 20 minute cookie 🍪⌛
const refCookie = useTotpCookie()

onMounted(async () => {

	if (hasText(refCookie.value)) {
		log('component loaded with stored cookie! 🔔🍪🔔', refCookie.value)
		//in this case, we need to move right to step 2, ttd november
	}


	let response = await fetchWorker('/totp', 'Status.')
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
const refButton = ref(null)

async function onEnroll() {
	let response = await fetchWorker('/totp', 'Enroll1.')
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
	let response = await fetchWorker('/totp', 'Enroll2.', {
		envelope: refCookie.value,
		code: refCode.value,
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
	<Button
		labeling="Requesting new enrollment..."
		:click="onEnroll"
	>Enroll</Button>
</div>

<div v-if="refUri" class="space-y-2">
	<div class="flex justify-center py-2">
		<div class="flex items-center gap-4">
			<div class="shrink-0">
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
			class="px-3 py-2 border border-gray-300 rounded-sm w-full text-center text-lg tracking-widest font-mono"
			@keyup.enter="refButton.click()"
		/>
		<Button
			ref="refButton"
			labeling="Validating..."
			:click="onValidate"
		>Validate Code</Button>
	</div>










</div>

</div>
</template>
