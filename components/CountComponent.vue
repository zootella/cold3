<script setup>

import { ref, reactive, watch, onMounted } from 'vue'

let browserTag = ref('')
let count = reactive({
	global: 0,
	browser: 0
})

//only will work on client
function queryStorage() {
	try {
		if (process.client) {

			let b = localStorage.getItem('browserTag')
			if (b) {
				browserTag.value = b
			} else {
				b = tag()
				browserTag.value = b
				localStorage.setItem('browserTag', b)
			}
			//you'll probably move browserTag into pinia so all the components can get to it
		}
	} catch (e) {
		log('caught error in query storage')
	}
}

//can work on server or client
async function queryServer() {
	try {

		let r = await useFetch('/api/count')
		count.global = r.data.value.countGlobal
		count.browser = r.data.value.countBrowser
		log(`fetched counts ${count.global} global, and ${count.browser} browser`)

	} catch (e) {
		log('caught error in query server')
	}
}

if (process.client) queryStorage()
queryServer()

onMounted(() => {
	//would like to query server and storage before the component mounts
})

async function clickedFetch() {
	await queryServer()
}
function clickedGlobal() {
	count.global++
}
function clickedBrowser() {
	count.browser++
}

/*
refactor based on current theories:

useFetch right away
that should be fine
doing it later gets that warning, too

protect localstorage with if process.client everywhere
but it should still be able to go before onmounted

*/

</script>
<template>

<div>
	<p>
		<button @click="clickedFetch">fetch counts</button>,
		Count
		<button @click="clickedGlobal">{{ count.global }} global</button>,
		<button @click="clickedBrowser">{{ count.browser }} browser</button>
		with browserTag <i>{{ browserTag }}</i>
	</p>
</div>

</template>
<style scoped>
</style>
