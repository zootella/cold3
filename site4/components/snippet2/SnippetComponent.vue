<script setup>

defineProps([
	'dynamicProperty',
	'staticProperty',
	'regularProperty'//passed as regular html, but you still need to mention it here, or use $attrs
])

</script>
<template>

<p v-if="dynamicProperty">dynamic property: type "{{ typeof dynamicProperty }}", value "{{ dynamicProperty }}"</p>
<p v-else>else because no dynamic property</p>

<p v-if="staticProperty">static property: type "{{ typeof staticProperty }}", value "{{ staticProperty }}"</p>
<p v-else>else because no static property</p>

<p v-if="regularProperty">regular property: type "{{ typeof regularProperty }}", value "{{ regularProperty }}"</p>
<p v-else>else because no regular property</p>

</template>
<style scoped>
</style>
