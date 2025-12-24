<script setup>//./components/QrCode.vue

import {
qrcodeDynamicImport,
} from 'icarus'

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
*/

const sourceRef = ref('')//img src data URL of btoa'ed SVG
const props = defineProps({
	address: {type: String, default: ''}//given URL, but really can be any text, even blank, to show as a QR code
})
watch(() => props.address, async () => {//if props.address changes, run generate; will only really happen in demo
	sourceRef.value = await qr(props.address)
}, {immediate: true})//run on mounted as well as again each time props.address changes

async function qr(url) {//url to turn into a QR code, can be "ok" but should be like "https://..." or "otpauth://"
	let svg//svg of the QR code, either from the qrcode module, or our default placeholder if there was a problem
	let toa//base64 of the svg markup, for the data url for the img src tag

	if (hasText(url) && import.meta.client) {//only try this if we were given text and we're running in a browser
		try {//most likely error is server render somehow gets in here, and import qrcode throws because web worker doesn't have canvas ☢️

			const {qrcode} = await qrcodeDynamicImport()//dynamic import also keeps qrcode out of the initial bundle; most users won't use it ⚖️
			svg = await qrcode.toString(url.trim(), {type: 'svg', width: 256, margin: 2})//width doesn't really matter for SVG; margin of 2 QR "module" lengths

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
`//placeholder so this component always renders a picture of something

</script>
<template>

<img v-if="sourceRef" :src="sourceRef" class="myLightOnly" />

</template>
<style scoped>

.myLightOnly {
	color-scheme: light only; /* prevent dimming and grayscaling on a phone's aggressive dark mode */
	filter: none !important;
	opacity: 1 !important; /* !important means, make this CSS rule win over others */
}
/* ttd august2025, testing on a fancy galaxy phone, dark mode, Samsung Internet app: a white background page is black, and the QR code is gray and dim (still scans right away from an iPhone, though). Chrome on the same phone doesn't do this. Added styles above to try to cut through this super aggressive dark mode, unsuccessfully. Android devices will redirect to the otpauth URL rather than showing it as a QR code anyway, of course */

</style>
