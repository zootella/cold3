<script setup>
import { watch } from 'vue'
import { log } from '~/library/library0'

// useFetch with POST method to manage count data
let { data, fetching, error, execute } = useFetch('/api/count', {
	method: 'POST',
	params: { count1: 0, count2: 0 } // Default params to fetch counts without incrementing
})

// Function to increment counts
async function incrementCount(increment1, increment2) {
	await execute({
		method: 'POST',
		params: {
			count1: increment1,
			count2: increment2
		}
	})
}

// Watch for changes to the data object and log the message
watch(data, (newData) => {
	if (newData && newData.message) {
		log('component got response with message: ' + newData.message);
	}
})

</script>

<template>
	<div>
		<h1>Count Details</h1>

		<!-- Only display the count details if the data is available -->
		<p v-if="data">
			Count 1: {{ data.count1 }} <br>
			Count 2: {{ data.count2 }}
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
