<script setup>

const mainStore = useMainStore()

function hardReload() { window.location.reload() }//same as user clicking the browser's Reload button

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>HelloComponent</i></p>

<p>
	server render took {{mainStore.serverDuration}}ms ⏱️
	<span v-if="mainStore.pageDuration != -1">
		{{mainStore.pageDuration}}ms total navigation to mounted
		{{' '}}<LinkButton @click="hardReload">Reload</LinkButton>
	</span>
</p>
<p>user:</p><pre>{{mainStore.user}}</pre>

</div>
</template>
