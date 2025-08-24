<script setup>//./components/QrComponent.vue

//                             _      
//   __ _ _ __    ___ ___   __| | ___ 
//  / _` | '__|  / __/ _ \ / _` |/ _ \
// | (_| | |    | (_| (_) | (_| |  __/
//  \__, |_|     \___\___/ \__,_|\___|
//     |_|                            

/*
https://www.denso-wave.com/en/technology/vol1.html - from 1994 🇯🇵; the blocks are called "modules"

https://www.npmjs.com/package/qrcode - leader with 3 million weekly downloads
https://github.com/soldair/node-qrcode

https://otpauth.molinero.dev/ - common choice for users of the otpauth module
*/

onMounted(async () => {//will not run in SSR
	await generate()
})

const addressRef = ref('')//input, user pastes in URL to make a QR code from it
const imageRef = ref('')//img src svg
async function generate() {
	imageRef.value = await _generate(addressRef.value)
}

async function _generate(url) {//url to turn into a QR code, can be "ok" but should be like "https://..." or "otpauth://"
	let svg//svg of the QR code, either from the qrcode module, or our default placeholder if there was a problem
	let toa//base64 of the svg markup, for the data url for the img src tag

	if (hasText(url) && process.client) {//only try this if we were given text and we're running in a browser
		try {//most likely error is server render somehow gets in here, and import qrcode throws because web worker doesn't have canvas ☢️

			const qrcode_module = await import('qrcode')//dynamic import also keeps qrcode out of the initial bundle; most users won't use it ⚖️
			svg = await qrcode_module.toString(url.trim(), {type: 'svg', width: 256, margin: 2})//width doesn't really matter for SVG; margin of 2 QR "module" lengths

		} catch (e) {}//discarding these errors because we don't have a way to report client errors without erroring the whole tab
	}
	if (!hasText(svg)) svg = placeholder//recover from error with placeholder

	try {//unlikely but possible error here is there's non-ASCII in the svg somehow, which btoa() can't handle

		toa = btoa(svg)

	} catch (e) {}
	if (!hasText(toa)) toa = btoa(placeholder)//recover from error with placeholder

	return 'data:image/svg+xml;base64,'+toa
}

const placeholder = `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 25 25" shape-rendering="crispEdges">
	<rect fill="#ffffff" width="25" height="25"/>

	<rect fill="#000000" x="2" y="2" width="7" height="1"/>
	<rect fill="#000000" x="2" y="3" width="1" height="5"/>
	<rect fill="#000000" x="2" y="8" width="7" height="1"/>
	<rect fill="#000000" x="8" y="3" width="1" height="5"/>

	<rect fill="#000000" x="16" y="2" width="7" height="1"/>
	<rect fill="#000000" x="16" y="3" width="1" height="5"/>
	<rect fill="#000000" x="16" y="8" width="7" height="1"/>
	<rect fill="#000000" x="22" y="3" width="1" height="5"/>

	<rect fill="#000000" x="2" y="16" width="7" height="1"/>
	<rect fill="#000000" x="2" y="17" width="1" height="5"/>
	<rect fill="#000000" x="2" y="22" width="7" height="1"/>
	<rect fill="#000000" x="8" y="17" width="1" height="5"/>
</svg>
`

</script>
<template>
<div class="border border-gray-300 p-2 bg-gray-100">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>QrComponent</i></p>

<div>
	<input @input="generate" v-model="addressRef" type="url" class="w-full" placeholder="Paste URL here" />

	<div class="py-4"><p>qrcode img src SVG, {{imageRef.length}} characters:</p><img v-if="imageRef" :src="imageRef" /></div>

</div>

</div>
</template>
