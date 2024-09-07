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

// [4] Fetch Net23 time from the third-party API (runs only on the server)
onServerPrefetch(async () => {
	try {
		const response = await $fetch('https://api.net23.cc/ping4', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${process.env.ACCESS_NETWORK_23}`,
				'Content-Type': 'application/json'
			}
		})
		net23Time.value = response.time // assuming the API returns { time: "..." }
	} catch (error) {
		console.error('Error fetching Net23 time:', error)
	}
})

// [3] Fetch server time during SSR (runs only on the server)
onServerPrefetch(() => {
	serverTime.value = new Date().toLocaleString()
})

// [2] Fetch client time once the component is mounted (runs only on the client)
onMounted(() => {
	message.value = new Date().toLocaleString()
})

</script>
<template>

<div>
<p>ping4: {{ message }}</p>
</div>

</template>
