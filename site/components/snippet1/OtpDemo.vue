<script setup>//./components/OtpDemo.vue

import {
browserIsBesideAppStore,
} from 'icarus'

const refButton = ref(null)
const refButtonCanSubmit = ref(true)
const refButtonInFlight = ref(false)

async function onClick() {
	let response = await refButton.value.post('/api/otp', {
		action: 'Create1.',
	})
	log('otp post response', look(response))
}

const addressRef = ref('')//input, user pastes in URL to make a QR code from it

</script>
<template>
<div class="border border-gray-300 p-2 bg-gray-100">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>OtpDemo</i></p>

<input v-model="addressRef" type="url" class="w-full" placeholder="Paste URL here" />
<div class="py-4 flex items-start space-x-4">
	<QrCode :address="addressRef" /><!-- component renders to an img src SVG data URL -->
	<div>
		<p>
			also, Are we running on a phone or tablet beside an authenticator app or app store to get one?
			{{browserIsBesideAppStore() ? '📲 ✅ YES' : '💻 🚫 NO'}}
		</p><!-- we'd probably actually call browserIsBesideAppStore() in code that runs onMounted -->
		<PostButton
			labelIdle="Setup1"
			labelFlying="Setup1ing..."
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
