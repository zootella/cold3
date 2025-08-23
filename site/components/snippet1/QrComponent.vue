<script setup>//./components/QrComponent.vue

//                             _      
//   __ _ _ __    ___ ___   __| | ___ 
//  / _` | '__|  / __/ _ \ / _` |/ _ \
// | (_| | |    | (_| (_) | (_| |  __/
//  \__, |_|     \___\___/ \__,_|\___|
//     |_|                            

/*
https://www.denso-wave.com/en/technology/vol1.html
the blocks are called "modules"

https://www.npmjs.com/package/qrcode
https://github.com/soldair/node-qrcode

https://otpauth.molinero.dev/
*/

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
		try {//most likely error is server render somehow gets in here, and import qrcode throws because web worker doesn't have canvas ☢️
			const qrcode_module = await import('qrcode')//dynamic import also keeps qrcode out of the initial bundle; most users won't use it ⚖️

			method1.value = await qrcode_module.toDataURL(address, {width: 256, margin: 2})//width doesn't matter for SVG; 
			method2.value = await qrcode_module.toString(address, {type: 'svg', width: 256, margin: 2})//width doesn't really matter for SVG; margin of 2 QR "module" lengths
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
	<input @input="generate" v-model="addressRef" type="url" class="w-full" placeholder="Paste URL here" />

	<div v-if="errorRef"><pre>{{errorRef}}</pre></div>

	<div class="py-4"><p>method 1: img src PNG,      {{method1.length}} characters:</p><img v-if="method1" :src="method1" /></div>
	<div class="py-4"><p>method 2: raw SVG,          {{method2.length}} characters:</p><div v-if="method2" v-html="method2"></div></div>
	<div class="py-4"><p>method 3: img src SVG,      {{method3.length}} characters:</p><img v-if="method3" :src="method3" /></div>

	<!-- note that we're using v-html safely in method2 above, but it is considered potentially unsafe! -->
</div>

</div>
</template>
