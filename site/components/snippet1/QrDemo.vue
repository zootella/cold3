<script setup>//./components/QrDemo.vue

const addressRef = ref('')//input, user pastes in URL to make a QR code from it

</script>
<template>
<div class="border border-gray-300 p-2 bg-gray-100">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>QrComponent</i></p>

<input v-model="addressRef" type="url" class="w-full" placeholder="Paste URL here" />
<div class="py-4">
	<QrCode :address="addressRef" /><!-- component renders to an img src SVG data URL -->
</div>

</div>
</template>
