<script setup> definePageMeta({layout: 'column-layout', note: 'on blank'})

function hardReload() { window.location.reload() }//same as user clicking the browser's Reload button

</script>
<template>

<p>
	A component-free page to render other routes client, not server
	<LinkButton @click="hardReload">Reload</LinkButton>
</p>

</template>
