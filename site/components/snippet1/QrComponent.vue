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

current idea as to choices
- use svg not png
- use qrcode-generator not qrcode
- reason to put in icarus is so you can have a test that confirms its there
- or just keep in site only
[]clean up imports of otpauth, qrcode, and qrcode-generator in lots of different package.json files!
*/

const addressRef = ref('')//input, user pastes in URL to make a QR code from it
const errorRef = ref('')//output, or error information trying to generate it

const method1 = ref('')//qrcode: img src png
const method2 = ref('')//qrcode: raw svg tag delivered with v-html
const method3 = ref('')//qrcode: img src svg
const method4 = ref('')//qrcode-generator: img src svg

async function generate() {
	const module1 = await import('qrcode')
	const module2 = await import('qrcode-generator')

	errorRef.value = ''
	method1.value = ''
	method2.value = ''
	method3.value = ''
	method4.value = ''
	let address = addressRef.value.trim()
	if (address) {
		try {
			const width = 256//units of natural pixels of generated raster image
			const margin = 2//units of QR code blocks!

			method1.value = await module1.toDataURL(address, {width, margin})
			method2.value = await module1.toString(address, {type: 'svg', width, margin})//width sets SVG's internal coordinate precision; vector graphics will scale sharply to any size
			method3.value = `data:image/svg+xml;base64,${btoa(method2.value)}`

			let svg4 = await generate4(module2, address)
			method4.value = `data:image/svg+xml;base64,${btoa(svg4)}`

			log(look({
				svg2: method2.value,
				svg4,
			}))
		} catch (e) {
			errorRef.value = `Caught error ${e}`
		}
	} else {
		errorRef.value = 'Cannot generate from blank'
	}
}
function generate4(module2, address) {
	
	// Create QR code
	const qr = module2.qrcode(0, 'L')  // Type 0 (auto), Error correction L
	qr.addData(address)
	qr.make()
	
	// Build SVG
	const modules = qr.getModuleCount()
	const cellSize = 8
	const margin = 16  // 2 QR blocks * 8 pixels
	const size = modules * cellSize + margin * 2
	
	let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`
	svg += `<rect width="${size}" height="${size}" fill="white"/>`
	
	for (let row = 0; row < modules; row++) {
		for (let col = 0; col < modules; col++) {
			if (qr.isDark(row, col)) {
				const x = margin + col * cellSize
				const y = margin + row * cellSize
				svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="black"/>`
			}
		}
	}
	svg += '</svg>'

	return svg
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
	<div class="py-4"><p>method 4: qrcode-generator, {{method4.length}} characters:</p><img v-if="method4" :src="method4" /></div>

	<!-- note that we're using v-html safely in method2 above, but it is considered potentially unsafe! -->
</div>

</div>
</template>
