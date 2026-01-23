<script setup>

import {
sayPlural,
} from 'icarus'
const pageStore = usePageStore()
const refCookie = useOtpCookie()

onMounted(async () => {//this component is on TopBar, so we mount once and always at the start of the spa
	if (
		hasText(refCookie.value) &&//if we have an otp envelope cookie,
		!pageStore.otps.length//(the page store can't know about any challenges yet, so the store array will be empty)
	) {

		//post the envelope to the server to tell us what it can about the open challenges
		let response = await fetchWorker('/api/otp', {body: {action: 'FoundEnvelope.', envelope: refCookie.value}})
		pageStore.otps = response.otps
		refCookie.value = hasText(response.envelope) ? response.envelope : null//update or clear the temporary envelope cookie

		log('otp found envelope response', look(response))//ttd january
	}
})

</script>
<template>
<div v-if="pageStore.otps.length" class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>OtpEnterList</i></p>

<p>this browser has ({{pageStore.otps.length}}) live otp{{sayPlural(pageStore.otps.length)}}:</p>
<div v-for="element in pageStore.otps" :key="element.tag">
	<OtpEnterComponent :otp="element" />
</div>

</div>
</template>
