<script setup>//./components/TotpDemo.vue

import {
browserIsBesideAppStore,
} from 'icarus'

const refButton = ref(null)
const refButtonCanSubmit = ref(true)
const refButtonInFlight = ref(false)

async function onClick() {
	let response = await refButton.value.post('/api/totp', {
		action: 'Enroll1.',
	})
	log('totp post response', look(response))
	addressRef.value = response.uri
}

const addressRef = ref('')//input, user pastes in URL to make a QR code from it

</script>
<template>
<div class="border border-gray-300 p-2 bg-gray-100">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>TotpDemo</i></p>

<input v-model="addressRef" type="url" class="w-full" placeholder="Paste URL here" />
<div class="py-4 flex items-start space-x-4">
	<QrCode :address="addressRef" /><!-- component renders to an img src SVG data URL -->
	<div>
		<p>
			also, Are we running on a phone or tablet beside an authenticator app or app store to get one?
			{{browserIsBesideAppStore() ? '📲 ✅ YES' : '💻 🚫 NO'}}
		</p><!-- we'd probably actually call browserIsBesideAppStore() in code that runs onMounted -->
		<PostButton
			labelIdle="Enroll1"
			labelFlying="Enroll1ing..."
			:useTurnstile="true"

			ref="refButton"
			:canSubmit="refButtonCanSubmit"
			v-model:inFlight="refButtonInFlight"
			:onClick="onClick"
		/>
	</div>
</div>

</div>
</template>
