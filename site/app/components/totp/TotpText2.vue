<script setup>

//prop not slot because presence of identifier drives the v-if guard, keeping visibility self-contained
const props = defineProps({
	identifier: {type: String, default: ''},
})

</script>
<template>

<p v-if="identifier">
Have a lot of these?
Look for the listing labeled <code>[{{ identifier }}]</code> in your authenticator app.
</p>

</template>
