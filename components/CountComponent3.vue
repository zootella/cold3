<script setup>

import { ref, reactive, watch, onMounted } from 'vue'
import {
log, look, Now, Tag,
getBrowserTag
} from '@/library/grand.js'

onMounted(async () => {//doesn't run on server, even when hydrating
	await getCounts()
})


const delay = ref(-1)

async function incrementGlobal()  { await callCount(1, 0) }
async function incrementBrowser() { await callCount(0, 1) }
async function getCounts()        { await callCount(0, 0) }
async function callCount(incrementGlobal, incrementBrowser) {
	try {
		let t = Now()
		let response = await $fetch('/api/count3', {
			method: 'POST',
			body: {
				browserTag: getBrowserTag(),
				incrementGlobal,
				incrementBrowser
			}
		})
		delay.value = Now() - t
		//log('success', look(response))
//		statusText.value = `This browser is ${response.signedIn2 ? 'signed in. 🟢' : 'signed out. ❌'} Fetch: ${t}ms. Note: ${response.note}`
		return response
	} catch (e) {
		log('caught', e)
	}
}


let browserTag = ref('')
function queryStorage() {
	try {
		if (process.client) {//remember, nuxt runs this stuff on the cloudflare worker, too

			let b = localStorage.getItem('browserTag')
			if (b) {
				browserTag.value = b
			} else {
				b = Tag()
				browserTag.value = b
				localStorage.setItem('browserTag', b)
			}
			//you'll probably move browserTag into pinia so all the components can get to it
		}
	} catch (e) {
		log('query storage caught', e)
	}
}
queryStorage()

let tick = reactive({
	durationGlobal: '-',
	durationBrowser: '-'
})

// useFetch with POST method to manage count data
let { data, fetching, error } = useFetch('/api/count3', {
	method: 'POST',
	body: {
		countGlobal: 0,
		countBrowser: 0,
		message: 'first message'
	}
})

// Function to increment counts
async function incrementCount(increment1, increment2) {
	try {

		let tick1 = Now()
		let data2 = await $fetch('/api/count3', {
			method: 'POST',
			body: {
				countGlobal: increment1,
				countBrowser: increment2,
				message: 'later message'
			}
		})
		let tick2 = Now()
		delay.value = tick2 - tick1
		//log(`fetch ran in ${tick2 - tick1}ms`)
		//log('data.value.countGlobal')
		//log(data.value.countGlobal)

		data.value.countGlobal = data2.countGlobal
		tick.durationGlobal = tick2 - tick1

	} catch (e) {
		log('increment count caught', e)
	}
}


</script>

<template>
	<div>

		<!-- Only display the count details if the data is available -->
		<p v-if="data">

			Count3
			<button @click="incrementCount(1, 0)">{{ data.countGlobal }} global</button>,
			<button @click="incrementCount(0, 1)">{{ data.countBrowser }} browser</button>
			updated in {{ delay }}ms for this browser tagged <i>{{ getBrowserTag() }}</i>.

		</p>
		<!-- Display a loading message while the data is being fetched -->
		<p v-else-if="fetching">Loading...</p>
		<!-- Display an error message if there was an error fetching the data -->
		<p v-else>Error: {{ error }}</p>

	</div>
</template>
