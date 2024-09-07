<script setup>

import { ref, onMounted } from 'vue'
import { onServerPrefetch } from '#app'

let message = ref('')

/*
ping1 cloudflare pages, static page
ping2 cloudflare workers, server time
ping3 worker to supabase, database query
ping4 worker to amazon, lambda time
*/

onServerPrefetch(async () => {
	try {
		const response = await $fetch('https://api.net23.cc/ping4', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${process.env.ACCESS_NETWORK_23}`,
				'Content-Type': 'application/json'
			}
		})
		message.value = response.tick
	} catch (e) {
		console.error('ping4', e)
	}
})

</script>
<template>

<div>
<p>ping4: {{ message }}</p>
</div>

</template>
