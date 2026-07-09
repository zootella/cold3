<script setup>

import {
sayPlural,
} from 'icarus'
const credentialStore = useCredentialStore()

//this component is on TopBar, so we mount once and always at the start of the spa
//recovery of live challenges from the envelope cookie rides the store's one Get., replacing the old FoundEnvelope. round trip
let p = credentialStore.load()
if (import.meta.server) await p//flex: block the server render so live challenges paint with the page; on the client, loaded state arrived in the payload

</script>
<template>
<div v-if="credentialStore.otps.length" class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>OtpEnterList</i></p>

<p>this browser has ({{credentialStore.otps.length}}) live otp{{sayPlural(credentialStore.otps.length)}}:</p>
<div v-for="element in credentialStore.otps" :key="element.tag">
	<OtpEnterComponent :otp="element" />
</div>

</div>
</template>
