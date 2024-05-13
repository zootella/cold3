<script setup>
import { watch } from 'vue'
import { log, see } from '~/library/library0'

// useFetch with POST method to manage count data
let { data, fetching, error } = useFetch('/api/count', {
	method: 'POST',
	body: {
		count1: 0,
		count2: 0,
		message: 'first message'
	}
})

// Function to increment counts
async function incrementCount(increment1, increment2) {
	let tick1 = Date.now()
	let f = await $fetch('/api/count', {
		method: 'POST',
		body: {
			count1: increment1,
			count2: increment2,
			message: 'later message'
		}
	})
	let tick2 = Date.now()
	log(`fetch ran in ${tick2 - tick1}ms`)
	console.log(f)
}

// Watch for changes to the data object and log the message
watch(data, (newData, oldData) => {//data contains reactive members, newData and oldData are unwrapped
	log('watch data', see(oldData), see(newData))
})

</script>

<template>
	<div>
		<h1>Count Details, hi</h1>

		<!-- Only display the count details if the data is available -->
		<p v-if="data">
			count1: {{ data.count1 }} <br>
			count2: {{ data.count2 }}
		</p>
		<!-- Display a loading message while the data is being fetched -->
		<p v-else-if="fetching">Loading...</p>
		<!-- Display an error message if there was an error fetching the data -->
		<p v-else>Error: {{ error }}</p>

		<!-- Buttons to increment counts -->
		<button @click="incrementCount(1, 0)">Increment Count 1</button>
		<button @click="incrementCount(0, 1)">Increment Count 2</button>

	</div>
</template>
