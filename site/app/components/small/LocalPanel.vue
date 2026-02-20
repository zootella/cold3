<script setup>

const colorMode = useColorMode()

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>LocalPanel</i></p>

<fieldset>
	<legend class="sr-only">Color mode</legend>
	<label class="mr-4"><input type="radio" v-model="colorMode.preference" value="light" /> Light</label>
	<label class="mr-4"><input type="radio" v-model="colorMode.preference" value="dark" /> Dark</label>
	<label><input type="radio" v-model="colorMode.preference" value="system" /> System</label>
</fieldset>

</div>
</template>
