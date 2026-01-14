<script setup>

const mainStore = useMainStore()
const credentialStore = useCredentialStore()
await credentialStore.load()

function hardReload() { window.location.reload() }//same as user clicking the browser's Reload button

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>HelloComponent</i></p>

<p>
	server render took {{mainStore.serverDuration}}ms ⏱️
	<span v-if="mainStore.pageDuration != -1">
		{{mainStore.pageDuration}}ms total navigation to mounted
		{{' '}}<Button link :click="hardReload">Reload</Button>
	</span>
</p>

<p>browserHash <code>{{credentialStore.browserHash}}</code></p>
<template v-if="credentialStore.userTag">
	<p>userTag <code>{{credentialStore.userTag}}</code> signed in</p>
	<p v-if="credentialStore.userDisplayName">user display name <code>{{credentialStore.userDisplayName}}</code></p>
</template>
<template v-else>
	<p>user: <i>not signed in</i></p>
</template>

</div>
</template>
