<script setup>//./components/QrComponent.vue

/*
this is in a full stack js web app, using nuxt 3 and vue's composition api
we're deploying to cloudflare web workers
and want to choose isomorphic js modules that work in all three of these environments:
- browser, where you can do things like canvas
- node, where you can do things like buffer
- web worker, which is the most restrictive of the three!
additionally, we want to avoid configure and usage complexities around detecting environments--rather, we want to write clean simple durable js code that we have full confidence will run great, everywhere!

ok, we're evaluating two popular qr code modules:
https://www.npmjs.com/package/qrcode
good:
- most popular, millions of weekly installs
bad:
- line (A) below causes crash deployed; the web worker server render

https://www.npmjs.com/package/qrcode-generator
good:
- very popular, hundreds of thousands of weekly installs
- zero dependency design, yarn add and you get one thing
bad:
- commonjs still, author hasn't updated to esm

so my first question is this: is there a difference between doing the import at A or B?
what happens during the build? the server render? upon user input?
(as written, B doesn't run until user input, but something got the module built into the client bundle--these sorts of considerations)
let's be rigorous, detailed, specific and correct!
*/

//import QRCode from 'qrcode'//(A) an import up here breaks ssr in the web worker!
import QRCodeGenerator from 'qrcode-generator'//(C) alternative module we're evaluating

const addressRef = ref('')//input, user pastes in URL to make a QR code from it
const errorRef = ref('')//output, or error information trying to generate it

const method1 = ref('')//qrcode: img src png
const method2 = ref('')//qrcode: raw svg tag delivered with v-html
const method3 = ref('')//qrcode: img src svg
const method4 = ref('')//qrcode-generator: img src svg

async function generate() {
	log(look(QRCodeGenerator))//look at the static import

  const QRCode = await import('qrcode')//(B) my expectation is moving it here will be no different!
  //(D) alternatively, we could do a dynamic import of qrcode-generator

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
	<input @input="generate" v-model="addressRef" type="url" class="w-full" placeholder="Paste URL here" />

	<div v-if="errorRef"><pre>{{errorRef}}</pre></div>

	<div class="py-4"><p>method 1: img src PNG, {{method1.length}} characters:</p><img v-if="method1" :src="method1" /></div>
	<div class="py-4"><p>method 2: raw SVG,     {{method2.length}} characters:</p><div v-if="method2" v-html="method2"></div></div>
	<div class="py-4"><p>method 3: img src SVG, {{method3.length}} characters:</p><img v-if="method3" :src="method3" /></div>

	<!-- note that we're using v-html safely in method2 above, but it is considered potentially unsafe! -->
</div>

</div>
</template>
