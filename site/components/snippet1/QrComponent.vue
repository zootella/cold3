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

/*
guard against
1 blank input
2 process.client
if those are ok then try import and toString
if exception 3
or 4 svg is blank somehow from module
123 use placeholder, otherwise use svg from qrcode


*/

const addressRef = ref('')//input, user pastes in URL to make a QR code from it
const imageRef = ref('')//img src svg

onMounted(async () => {//will not run in SSR
	await generate()
})

async function generate() {

	let svg = placeholder
	try {//most likely error is server render somehow gets in here, and import qrcode throws because web worker doesn't have canvas ☢️

		const qrcode_module = await import('qrcode')//dynamic import also keeps qrcode out of the initial bundle; most users won't use it ⚖️
		svg = await qrcode_module.toString(addressRef.value.trim(), {type: 'svg', width: 256, margin: 2})//width doesn't really matter for SVG; margin of 2 QR "module" lengths

	} catch (e) { log(e) }

	imageRef.value = `data:image/svg+xml;base64,${btoa(svg)}`//we don't worry about btoa throwing because svg is ASCII only
}

</script>
<template>
<div class="border border-gray-300 p-2 bg-gray-100">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>QrComponent</i></p>

<div>
	<input @input="generate" v-model="addressRef" type="url" class="w-full" placeholder="Paste URL here" />

	<div class="py-4"><p>qrcode img src SVG, {{imageRef.length}} characters:</p><img v-if="imageRef" :src="imageRef" /></div>

	<!-- note that we're using v-html safely in method2 above, but it is considered potentially unsafe! -->
</div>

</div>
</template>
