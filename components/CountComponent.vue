<script setup>

import { ref, watch, onMounted } from 'vue'
import { log } from "~/library/library0";
import { unique } from "~/library/library1";

//try {

let browserTag = ref('')
let count = reactive({
	global: 0,
	browser: 0
})

function queryStorage() {

	let b = localStorage.getItem('browserTag')
	if (b) {
		browserTag.value = b
	} else {
		b = unique()
		browserTag.value = b
		localStorage.setItem('browserTag', b)
	}
	//you'll probably move browserTag into pinia so all the components can get to it
}
queryStorage()

async function queryServer() {
	try {

		let r = await useFetch('/api/count')
		count.global = r.data.value.countGlobal
		count.browser = r.data.value.countBrowser
		log(`fetched counts ${count.global} global, and ${count.browser} browser`)

	} catch (e) {
		log('caught exception in query server')
	}
}
//queryServer()

onMounted(() => {
})

async function clickedFetch() {
	await queryServer()
}

async function clickedGlobal() {
	count.global++
}

async function clickedBrowser() {
	count.browser++
}

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
