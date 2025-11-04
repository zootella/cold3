<script setup>//./components/TotpDemo.vue

import {
sayTick, Data,
totpEnroll, totpSecretIdentifier, totpValidate, totpGenerate, totpConstants, checkTotpSecret, checkTotpCode,
browserIsBesideAppStore,
} from 'icarus'

const refLabel = ref('user.name@example.com')
const refUri = ref('')

let enrollment
async function generate() {
	enrollment = await totpEnroll({label: refLabel.value, issuer: Key('totp, issuer, public, page'), addIdentifier: true})
	refUri.value = enrollment.uri
}

function redirect() {
	window.location.href = enrollment.uri//ttd august2025, this is the plain html way, claude says best for otpauth on mobile; Nuxt has navigateTo, Vue Router has useRouter().push()
}

const refButton5 = ref(null); const refButton5CanSubmit = ref(true); const refButton5InFlight = ref(false)

async function onClick5() {
	let response = await refButton5.value.post('/api/totp', {
		action: 'Enroll1.',
	})
	log('response from enroll 1', look(response))
	if (response.outcome == 'Candidate.') {
		if (browserIsBesideAppStore()) {//on a phone, redirect to authenticator app
			
		} else {//on desktop, show the qr code
			refUri.value = response.enrollment.uri
		}
	}
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

<p>Default will beIs this a phone or tablet with an authenticator app or app store? {{browserIsBesideAppStore() ? '📲 ✅ YES' : '💻 🚫 NO'}}</p>

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
		</div>
	</div>
</div>

</div>
</template>
