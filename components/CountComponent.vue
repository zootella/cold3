<script setup>

import { ref, watch, onMounted } from 'vue'
import { log } from "~/library/library0";
import { unique } from "~/library/library1";

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
async function queryServer() {

	const r = await useFetch("/api/count")
	count.global = r.data.value.countGlobal
	count.browser = r.data.value.countBrowser
	log(`fetched counts ${count.global} global, and ${count.browser} browser`)
}

onMounted(async () => {
	queryStorage()
	await queryServer()
})

async function clickedGlobal() {
	count.global++
}

function clickedBrowser() {
	count.browser++
}

</script>
<template>

<div>
	<p>
		Count
		<button @click="clickedGlobal">{{ count.global }} global</button>,
		<button @click="clickedBrowser">{{ count.browser }} browser</button>
		with browserTag <i>{{ browserTag }}</i>
	</p>
</div>

</template>
<style scoped>
</style>
