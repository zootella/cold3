<script setup>

import {
sayPlural,
} from 'icarus'
const credentialStore = useCredentialStore()

//this component is on TopBar, so we mount once and always at the start of the spa
//live challenges arrive owner-scoped in the store's otps, painted with the server render like the rest of the snapshot
let p = credentialStore.load()
if (import.meta.server) await p//flex: block the server render so the store's snapshot paints with the page; on the client, loaded state arrived in the payload

</script>
<template>
<div v-if="credentialStore.otps.length" class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>OtpEnterList</i></p>

<p>you have ({{credentialStore.otps.length}}) live otp{{sayPlural(credentialStore.otps.length)}}:</p>
<div v-for="element in credentialStore.otps" :key="element.tag">
	<OtpEnterComponent :otp="element" />
</div>

</div>
</template>
