<script setup>

import { ref, reactive, watch } from 'vue'
import { log, look, Now } from '../library/library0.js'
import { Tag } from '../library/library1.js'






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
let { data, fetching, error } = useFetch('/api/count2', {
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
		let data2 = await $fetch('/api/count2', {
			method: 'POST',
			body: {
				countGlobal: increment1,
				countBrowser: increment2,
				message: 'later message'
			}
		})
		let tick2 = Now()
		log(`fetch ran in ${tick2 - tick1}ms`)
		console.log('data.value.countGlobal')
		console.log(data.value.countGlobal)

		data.value.countGlobal = data2.countGlobal
		tick.durationGlobal = tick2 - tick1

	} catch (e) {
		log('increment count caught', e)
	}
}

// Watch for changes to the data object and log the message
watch(data, (newData, oldData) => {//data contains reactive members, newData and oldData are unwrapped
//	log('watch data', look(oldData), look(newData))
})

</script>

<template>
	<div>

		<!-- Only display the count details if the data is available -->
		<p v-if="data">

			Count2
			<button @click="incrementCount(1, 0)">{{ data.countGlobal }} global</button>
			updated in {{ tick.durationGlobal }}ms, and
			<button @click="incrementCount(0, 1)">{{ data.countBrowser }} browser</button>
			updated in {{ tick.durationBrowser }}ms for this browser tagged <i>{{ browserTag }}</i>.

		</p>
		<!-- Display a loading message while the data is being fetched -->
		<p v-else-if="fetching">Loading...</p>
		<!-- Display an error message if there was an error fetching the data -->
		<p v-else>Error: {{ error }}</p>

	</div>
</template>
