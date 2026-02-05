<script setup>

import {
browserIsBesideAppStore,
} from 'icarus'

const addressRef = ref('')//input, user pastes in URL to make a QR code from it

</script>
<template>
<div class="border border-gray-300 p-2 bg-gray-100">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>QrDemo</i></p>

<input v-model="addressRef" type="url" class="w-full" placeholder="Paste URL here" />
<div class="py-4 flex items-start space-x-4">
	<QrCode :address="addressRef" /><!-- component renders to an img src SVG data URL -->
	<span>also, Are we running on a phone or tablet beside an authenticator app or app store to get one? {{browserIsBesideAppStore() ? '📲 ✅ YES' : '💻 🚫 NO'}}</span><!-- we'd probably actually call browserIsBesideAppStore() in code that runs onMounted -->
</div>

</div>
</template>
