<script setup>

import {
log, look, Now, Tag,
getBrowserTag,
} from 'icarus'
import {ref, reactive, onMounted, watch} from 'vue'

let browserTag = ref('')
onMounted(() => {
	browserTag.value = getBrowserTag()
})

let tick = reactive({
	durationGlobal: '-',
	durationBrowser: '-'
})

let {data, fetching, error} = useFetch('/api/count', {
	method: 'POST',
	body: {
		countGlobal: 0,
		countBrowser: 0,
		message: 'first message'
	}
})

async function incrementCount(increment1, increment2) {
	try {

		let tick1 = Now()
		let data2 = await $fetch('/api/count', {
			method: 'POST',
			body: {
				countGlobal: increment1,
				countBrowser: increment2,
				message: 'later message'
			}
		})
		let tick2 = Now()
		//log(`fetch ran in ${tick2 - tick1}ms`)
		//log('data.value.countGlobal')
		//log(data.value.countGlobal)

		data.value.countGlobal = data2.countGlobal
		tick.durationGlobal = tick2 - tick1

	} catch (e) {
		log('increment count caught', e)
	}
}

async function clickedHit() {
	let response = await $fetch('/api/hit', {
		method: 'POST',
		body: {
		}
	})
}

</script>

<template>
<div>

<!-- Only display the count details if the data is available -->
<p v-if="data">
	Count
	<button @click="incrementCount(1, 0)">{{ data.countGlobal }} global</button>
	updated in {{ tick.durationGlobal }}ms, and
	<button @click="incrementCount(0, 1)">{{ data.countBrowser }} browser</button>
	updated in {{ tick.durationBrowser }}ms for this browser tagged <i>{{ browserTag }}</i>.
</p>
<!-- Display a loading message while the data is being fetched -->
<p v-else-if="fetching">Loading...</p>
<!-- Display an error message if there was an error fetching the data -->
<p v-else>Error: {{ error }}</p>


<button @click="clickedHit">Hit</button>


</div>
</template>














































