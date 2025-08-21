<script setup>//./components/QrComponent.vue

import { ref } from 'vue'
import QRCode from 'qrcode'

const addressRef = ref('')//input, user pastes in URL to make a QR code from it
const imageRef = ref('')//output, data URL for img src of the QR code image
const errorRef = ref('')//output, or error information trying to generate it

async function generate() {
	errorRef.value = ''
	imageRef.value = ''
	let address = addressRef.value.trim()
	if (address) {
		try {
			imageRef.value = await QRCode.toDataURL(address, {width: 256, margin: 2})
		} catch (e) {
			errorRef.value = `Caught error ${e}`
		}
	} else {
		errorRef.value = 'Cannot generate from blank'
	}
}

</script>
<template>
<div class="border border-gray-300 p-2 bg-gray-100">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>QrComponent</i></p>

<div>
	<input @keyup.enter="generate" v-model="addressRef" type="url" class="w-96" placeholder="Paste URL here" />{{' '}}
	<Button @click="generate">Create QR Code</Button>

	<div v-if="errorRef"><pre>{{errorRef}}</pre></div>

	<div class="flex justify-center py-10">
		<img v-if="imageRef" :src="imageRef" />
	</div>
</div>

</div>
</template>
