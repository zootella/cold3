<script setup>//./components/QrComponent.vue

import { ref } from 'vue'
import QRCode from 'qrcode'

const addressRef = ref('')//input, user pastes in URL to make a QR code from it
const errorRef = ref('')//output, or error information trying to generate it

const method1 = ref('')//img src png
const method2 = ref('')//raw svg tag delivered with v-html
const method3 = ref('')//img src svg

async function generate() {
	errorRef.value = ''
	method1.value = ''
	method2.value = ''
	method3.value = ''
	let address = addressRef.value.trim()
	if (address) {
		try {
			const width = 256//units of natural pixels of generated raster image
			const margin = 2//units of QR code blocks!

			method1.value = await QRCode.toDataURL(address, {width, margin})
			method2.value = await QRCode.toString(address, {type: 'svg', width, margin})//width sets SVG's internal coordinate precision; vector graphics will scale sharply to any size
			method3.value = `data:image/svg+xml;base64,${btoa(method2.value)}`

			log(look({
				method1: method1.value,
				method2: method2.value,
				method3: method3.value,
			}))
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

	<div class="py-4"><p>method 1: img src PNG, {{method1.length}} characters:</p><img v-if="method1" :src="method1" /></div>
	<div class="py-4"><p>method 2: raw SVG, {{method2.length}} characters:</p><div v-if="method2" v-html="method2"></div></div>
	<div class="py-4"><p>method 3: img src SVG, {{method3.length}} characters:</p><img v-if="method3" :src="method3" /></div>

	<!-- note that we're using v-html safely in method2 above, but it is considered potentially unsafe! -->
</div>

</div>
</template>
