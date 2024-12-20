<script setup>

import {
log, look, Now,
} from 'icarus'
import {ref} from 'vue'

let refName = ref('')
let refTerms = ref(false) // Reactive variable for the checkbox
let refButtonDisabled = ref(false)
let refStatus = ref('(no status yet)')

function somethingChanged() {
	refStatus.value = `input changed to ${refName.value.length} characters and box checked ${refTerms.value}`
}

async function buttonClicked() {
	log('click')
	refTerms.value = false

	//have to do this to update status
	somethingChanged()
}

</script>
<template>
<div>

<p>Check if your desired username is available.</p>
<p>
	Name: <input type="text" v-model="refName" @input="somethingChanged" />
</p>
<p>
  <input type="checkbox" v-model="refTerms" @change="somethingChanged" /> Accept Terms
	<button :disabled="refButtonDisabled" @click="buttonClicked">Check</button>
</p>
<p>Status: <i>{{ refStatus }}</i></p>

</div>
</template>





/*
	try {
		let t = Now()
		let response = await $fetch('/api/name', {method: 'POST', body: {name: refName.value}})
		let d = Now() - t

		refStatus.value = `name api took ${d}ms to say: ${response.note}`
	} catch (e) {
		log('fetch caused exception:', look(e))
	}
*/

